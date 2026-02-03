import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';
import * as jwt from 'jsonwebtoken';

const ssmClient = new SSMClient({});

interface JWTPayload {
  userId: string;
  iat: number;
  exp: number;
}

async function getParameter(name: string, encrypted = false): Promise<string> {
  const command = new GetParameterCommand({
    Name: name,
    WithDecryption: encrypted,
  });
  const response = await ssmClient.send(command);
  return response.Parameter?.Value || '';
}

function generatePolicy(principalId: string, effect: string, resource: string, context?: any) {
  return {
    principalId,
    policyDocument: {
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'execute-api:Invoke',
          Effect: effect,
          Resource: resource,
        },
      ],
    },
    context: context || {},
  };
}

export const handler = async (event: any) => {
  console.log('Authorizer event:', JSON.stringify(event, null, 2));

  const token = event.authorizationToken;

  if (!token) {
    throw new Error('Unauthorized');
  }

  // Extract Bearer token
  const tokenParts = token.split(' ');
  if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
    throw new Error('Unauthorized');
  }

  const jwtToken = tokenParts[1];

  try {
    // Get JWT secret from SSM
    const jwtSecret = await getParameter(process.env.JWT_SECRET_PARAM!, true);

    // Verify and decode JWT
    const decoded = jwt.verify(jwtToken, jwtSecret) as JWTPayload;

    // Generate allow policy with user context
    return generatePolicy(decoded.userId, 'Allow', event.methodArn, {
      userId: decoded.userId,
    });
  } catch (error) {
    console.error('Token verification failed:', error);
    throw new Error('Unauthorized');
  }
};

