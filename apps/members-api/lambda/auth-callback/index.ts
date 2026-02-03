import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';
import * as jwt from 'jsonwebtoken';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const ssmClient = new SSMClient({});

interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
  email?: string;
}

async function getParameter(name: string, encrypted = false): Promise<string> {
  const command = new GetParameterCommand({
    Name: name,
    WithDecryption: encrypted,
  });
  const response = await ssmClient.send(command);
  return response.Parameter?.Value || '';
}

async function exchangeCodeForToken(code: string, redirectUri: string): Promise<string> {
  const clientId = await getParameter(process.env.DISCORD_CLIENT_ID_PARAM!);
  const clientSecret = await getParameter(process.env.DISCORD_CLIENT_SECRET_PARAM!, true);

  const response = await fetch('https://discord.com/api/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    throw new Error(`Discord token exchange failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.access_token;
}

async function fetchDiscordUser(accessToken: string): Promise<DiscordUser> {
  const response = await fetch('https://discord.com/api/users/@me', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Discord user fetch failed: ${response.statusText}`);
  }

  return await response.json();
}

async function saveUser(user: DiscordUser): Promise<void> {
  const now = new Date().toISOString();
  
  await docClient.send(
    new PutCommand({
      TableName: process.env.USERS_TABLE!,
      Item: {
        userId: user.id,
        discordUsername: user.username,
        discriminator: user.discriminator,
        avatar: user.avatar,
        email: user.email,
        lastLogin: now,
        createdAt: now,
      },
    })
  );
}

async function generateJWT(userId: string): Promise<string> {
  const jwtSecret = await getParameter(process.env.JWT_SECRET_PARAM!, true);
  
  return jwt.sign(
    { userId },
    jwtSecret,
    { expiresIn: '7d' }
  );
}

export const handler = async (event: any) => {
  console.log('Auth callback event:', JSON.stringify(event, null, 2));

  try {
    const code = event.queryStringParameters?.code;
    const state = event.queryStringParameters?.state;

    if (!code) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Missing authorization code' }),
      };
    }

    // Construct redirect URI based on environment
    const redirectUri = `${process.env.FRONTEND_URL}/members/callback/`;

    // Exchange code for Discord access token
    const accessToken = await exchangeCodeForToken(code, redirectUri);

    // Fetch Discord user info
    const discordUser = await fetchDiscordUser(accessToken);

    // Save/update user in DynamoDB
    await saveUser(discordUser);

    // Generate JWT for our API
    const token = await generateJWT(discordUser.id);

    // Return JWT token to frontend
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': process.env.FRONTEND_URL!,
      },
      body: JSON.stringify({
        token,
        user: {
          id: discordUser.id,
          username: discordUser.username,
          discriminator: discordUser.discriminator,
          avatar: discordUser.avatar,
        },
      }),
    };
  } catch (error) {
    console.error('Auth callback error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Authentication failed' }),
    };
  }
};

