import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, UpdateCommand, DeleteCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import { v4 as uuidv4 } from 'uuid';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const lambdaClient = new LambdaClient({});

interface Decklist {
  decklistId: string;
  userId: string;
  moxfieldUrl: string;
  eventId?: string;
  rank?: number;
  winLoss?: string;
  deckData?: any;
  createdAt: string;
  updatedAt: string;
}

function parseBody(event: any) {
  return event.body ? JSON.parse(event.body) : {};
}

function response(statusCode: number, body: any) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify(body),
  };
}

async function listDecklists(event: any) {
  const { eventId, userId, limit = 50 } = event.queryStringParameters || {};

  let items;

  if (eventId) {
    // Query by event, sorted by rank
    const result = await docClient.send(
      new QueryCommand({
        TableName: process.env.DECKLISTS_TABLE!,
        IndexName: 'eventId-rank-index',
        KeyConditionExpression: 'eventId = :eventId',
        ExpressionAttributeValues: {
          ':eventId': eventId,
        },
        Limit: parseInt(limit),
      })
    );
    items = result.Items;
  } else if (userId) {
    // Query by user, sorted by creation date
    const result = await docClient.send(
      new QueryCommand({
        TableName: process.env.DECKLISTS_TABLE!,
        IndexName: 'userId-createdAt-index',
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId,
        },
        ScanIndexForward: false,
        Limit: parseInt(limit),
      })
    );
    items = result.Items;
  } else {
    // Scan all (consider pagination in production)
    const result = await docClient.send(
      new ScanCommand({
        TableName: process.env.DECKLISTS_TABLE!,
        Limit: parseInt(limit),
      })
    );
    items = result.Items;
  }

  return response(200, { decklists: items || [] });
}

async function getDecklist(decklistId: string) {
  const result = await docClient.send(
    new GetCommand({
      TableName: process.env.DECKLISTS_TABLE!,
      Key: { decklistId },
    })
  );

  if (!result.Item) {
    return response(404, { error: 'Decklist not found' });
  }

  return response(200, result.Item);
}

async function createDecklist(event: any, userId: string) {
  const body = parseBody(event);
  const { moxfieldUrl, eventId, rank, winLoss } = body;

  if (!moxfieldUrl) {
    return response(400, { error: 'moxfieldUrl is required' });
  }

  // Validate moxfield URL
  if (!moxfieldUrl.includes('moxfield.com')) {
    return response(400, { error: 'Invalid moxfield.com URL' });
  }

  const decklistId = uuidv4();
  const now = new Date().toISOString();

  const decklist: Decklist = {
    decklistId,
    userId,
    moxfieldUrl,
    eventId,
    rank: rank ? parseInt(rank) : undefined,
    winLoss,
    createdAt: now,
    updatedAt: now,
  };

  await docClient.send(
    new PutCommand({
      TableName: process.env.DECKLISTS_TABLE!,
      Item: decklist,
    })
  );

  // Trigger async moxfield fetcher (fire and forget)
  try {
    await lambdaClient.send(
      new InvokeCommand({
        FunctionName: process.env.MOXFIELD_FETCHER_FUNCTION!,
        InvocationType: 'Event',
        Payload: JSON.stringify({ decklistId, moxfieldUrl }),
      })
    );
  } catch (error) {
    console.error('Failed to invoke moxfield fetcher:', error);
  }

  return response(201, decklist);
}

async function updateDecklist(decklistId: string, event: any, userId: string) {
  // First check if decklist exists and user owns it
  const existing = await docClient.send(
    new GetCommand({
      TableName: process.env.DECKLISTS_TABLE!,
      Key: { decklistId },
    })
  );

  if (!existing.Item) {
    return response(404, { error: 'Decklist not found' });
  }

  if (existing.Item.userId !== userId) {
    return response(403, { error: 'You can only update your own decklists' });
  }

  const body = parseBody(event);
  const { moxfieldUrl, eventId, rank, winLoss } = body;

  const updateExpressions = [];
  const attributeValues: any = {
    ':updatedAt': new Date().toISOString(),
  };
  const attributeNames: any = {};

  if (moxfieldUrl) {
    updateExpressions.push('#moxfieldUrl = :moxfieldUrl');
    attributeValues[':moxfieldUrl'] = moxfieldUrl;
    attributeNames['#moxfieldUrl'] = 'moxfieldUrl';
  }
  if (eventId !== undefined) {
    updateExpressions.push('eventId = :eventId');
    attributeValues[':eventId'] = eventId;
  }
  if (rank !== undefined) {
    updateExpressions.push('#rank = :rank');
    attributeValues[':rank'] = parseInt(rank);
    attributeNames['#rank'] = 'rank';
  }
  if (winLoss !== undefined) {
    updateExpressions.push('winLoss = :winLoss');
    attributeValues[':winLoss'] = winLoss;
  }

  updateExpressions.push('updatedAt = :updatedAt');

  await docClient.send(
    new UpdateCommand({
      TableName: process.env.DECKLISTS_TABLE!,
      Key: { decklistId },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeValues: attributeValues,
      ExpressionAttributeNames: Object.keys(attributeNames).length > 0 ? attributeNames : undefined,
    })
  );

  return response(200, { message: 'Decklist updated successfully' });
}

async function deleteDecklist(decklistId: string, userId: string) {
  // First check if decklist exists and user owns it
  const existing = await docClient.send(
    new GetCommand({
      TableName: process.env.DECKLISTS_TABLE!,
      Key: { decklistId },
    })
  );

  if (!existing.Item) {
    return response(404, { error: 'Decklist not found' });
  }

  if (existing.Item.userId !== userId) {
    return response(403, { error: 'You can only delete your own decklists' });
  }

  await docClient.send(
    new DeleteCommand({
      TableName: process.env.DECKLISTS_TABLE!,
      Key: { decklistId },
    })
  );

  return response(200, { message: 'Decklist deleted successfully' });
}

export const handler = async (event: any) => {
  console.log('Decklists event:', JSON.stringify(event, null, 2));

  try {
    const httpMethod = event.httpMethod;
    const pathParameters = event.pathParameters || {};
    const decklistId = pathParameters.id;
    const userId = event.requestContext?.authorizer?.userId;

    switch (httpMethod) {
      case 'GET':
        if (decklistId) {
          return await getDecklist(decklistId);
        } else {
          return await listDecklists(event);
        }

      case 'POST':
        if (!userId) {
          return response(401, { error: 'Unauthorized' });
        }
        return await createDecklist(event, userId);

      case 'PUT':
        if (!userId) {
          return response(401, { error: 'Unauthorized' });
        }
        if (!decklistId) {
          return response(400, { error: 'Decklist ID required' });
        }
        return await updateDecklist(decklistId, event, userId);

      case 'DELETE':
        if (!userId) {
          return response(401, { error: 'Unauthorized' });
        }
        if (!decklistId) {
          return response(400, { error: 'Decklist ID required' });
        }
        return await deleteDecklist(decklistId, userId);

      default:
        return response(405, { error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Decklists error:', error);
    return response(500, { error: 'Internal server error' });
  }
};

