import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

interface MoxfieldDeck {
  name: string;
  format: string;
  commanders?: any[];
  mainboard: { [key: string]: any };
  sideboard?: { [key: string]: any };
  colors?: string[];
  authorName?: string;
}

async function fetchMoxfieldDeck(moxfieldUrl: string): Promise<MoxfieldDeck | null> {
  try {
    // Extract deck ID from URL
    // URLs are like: https://www.moxfield.com/decks/DECK_ID
    const deckIdMatch = moxfieldUrl.match(/moxfield\.com\/decks\/([a-zA-Z0-9_-]+)/);
    
    if (!deckIdMatch) {
      console.error('Invalid Moxfield URL:', moxfieldUrl);
      return null;
    }

    const deckId = deckIdMatch[1];
    const apiUrl = `https://api2.moxfield.com/v3/decks/all/${deckId}`;

    console.log('Fetching from Moxfield API:', apiUrl);

    const response = await fetch(apiUrl);

    if (!response.ok) {
      console.error('Moxfield API error:', response.status, response.statusText);
      return null;
    }

    const data = await response.json();
    
    return {
      name: data.name,
      format: data.format,
      commanders: data.commanders,
      mainboard: data.boards?.mainboard || data.mainboard || {},
      sideboard: data.boards?.sideboard || data.sideboard || {},
      colors: data.colors,
      authorName: data.authorName,
    };
  } catch (error) {
    console.error('Error fetching from Moxfield:', error);
    return null;
  }
}

async function updateDecklistWithData(decklistId: string, deckData: MoxfieldDeck) {
  await docClient.send(
    new UpdateCommand({
      TableName: process.env.DECKLISTS_TABLE!,
      Key: { decklistId },
      UpdateExpression: 'SET deckData = :deckData, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':deckData': deckData,
        ':updatedAt': new Date().toISOString(),
      },
    })
  );
}

export const handler = async (event: any) => {
  console.log('Moxfield fetcher event:', JSON.stringify(event, null, 2));

  try {
    const { decklistId, moxfieldUrl } = event;

    if (!decklistId || !moxfieldUrl) {
      console.error('Missing decklistId or moxfieldUrl');
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required parameters' }),
      };
    }

    // Fetch deck data from Moxfield
    const deckData = await fetchMoxfieldDeck(moxfieldUrl);

    if (!deckData) {
      console.error('Failed to fetch deck data from Moxfield');
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to fetch deck data' }),
      };
    }

    // Update DynamoDB with fetched data
    await updateDecklistWithData(decklistId, deckData);

    console.log('Successfully updated decklist with Moxfield data:', decklistId);

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        message: 'Deck data fetched and stored successfully',
        deckName: deckData.name,
      }),
    };
  } catch (error) {
    console.error('Moxfield fetcher error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};

