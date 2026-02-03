import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, UpdateCommand, DeleteCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

interface Event {
  eventId: string;
  userId: string;
  name: string;
  date: string;
  location?: string;
  format?: string;
  organizer?: string;
  description?: string;
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

async function listEvents(event: any) {
  const { date, limit = 50 } = event.queryStringParameters || {};

  let items;

  if (date) {
    // Query by date
    const result = await docClient.send(
      new QueryCommand({
        TableName: process.env.EVENTS_TABLE!,
        IndexName: 'date-index',
        KeyConditionExpression: '#date = :date',
        ExpressionAttributeNames: {
          '#date': 'date',
        },
        ExpressionAttributeValues: {
          ':date': date,
        },
        Limit: parseInt(limit),
      })
    );
    items = result.Items;
  } else {
    // Scan all events
    const result = await docClient.send(
      new ScanCommand({
        TableName: process.env.EVENTS_TABLE!,
        Limit: parseInt(limit),
      })
    );
    items = result.Items;
  }

  return response(200, { events: items || [] });
}

async function getEvent(eventId: string) {
  const result = await docClient.send(
    new GetCommand({
      TableName: process.env.EVENTS_TABLE!,
      Key: { eventId },
    })
  );

  if (!result.Item) {
    return response(404, { error: 'Event not found' });
  }

  return response(200, result.Item);
}

async function createEvent(event: any, userId: string) {
  const body = parseBody(event);
  const { name, date, location, format, organizer, description } = body;

  if (!name || !date) {
    return response(400, { error: 'name and date are required' });
  }

  const eventId = uuidv4();
  const now = new Date().toISOString();

  const eventItem: Event = {
    eventId,
    userId,
    name,
    date,
    location,
    format: format || 'Standard',
    organizer,
    description,
    createdAt: now,
    updatedAt: now,
  };

  await docClient.send(
    new PutCommand({
      TableName: process.env.EVENTS_TABLE!,
      Item: eventItem,
    })
  );

  return response(201, eventItem);
}

async function updateEvent(eventId: string, event: any, userId: string) {
  // First check if event exists and user owns it
  const existing = await docClient.send(
    new GetCommand({
      TableName: process.env.EVENTS_TABLE!,
      Key: { eventId },
    })
  );

  if (!existing.Item) {
    return response(404, { error: 'Event not found' });
  }

  if (existing.Item.userId !== userId) {
    return response(403, { error: 'You can only update your own events' });
  }

  const body = parseBody(event);
  const { name, date, location, format, organizer, description } = body;

  const updateExpressions = [];
  const attributeValues: any = {
    ':updatedAt': new Date().toISOString(),
  };
  const attributeNames: any = {};

  if (name) {
    updateExpressions.push('#name = :name');
    attributeValues[':name'] = name;
    attributeNames['#name'] = 'name';
  }
  if (date) {
    updateExpressions.push('#date = :date');
    attributeValues[':date'] = date;
    attributeNames['#date'] = 'date';
  }
  if (location !== undefined) {
    updateExpressions.push('location = :location');
    attributeValues[':location'] = location;
  }
  if (format !== undefined) {
    updateExpressions.push('#format = :format');
    attributeValues[':format'] = format;
    attributeNames['#format'] = 'format';
  }
  if (organizer !== undefined) {
    updateExpressions.push('organizer = :organizer');
    attributeValues[':organizer'] = organizer;
  }
  if (description !== undefined) {
    updateExpressions.push('description = :description');
    attributeValues[':description'] = description;
  }

  updateExpressions.push('updatedAt = :updatedAt');

  await docClient.send(
    new UpdateCommand({
      TableName: process.env.EVENTS_TABLE!,
      Key: { eventId },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeValues: attributeValues,
      ExpressionAttributeNames: Object.keys(attributeNames).length > 0 ? attributeNames : undefined,
    })
  );

  return response(200, { message: 'Event updated successfully' });
}

async function deleteEvent(eventId: string, userId: string) {
  // First check if event exists and user owns it
  const existing = await docClient.send(
    new GetCommand({
      TableName: process.env.EVENTS_TABLE!,
      Key: { eventId },
    })
  );

  if (!existing.Item) {
    return response(404, { error: 'Event not found' });
  }

  if (existing.Item.userId !== userId) {
    return response(403, { error: 'You can only delete your own events' });
  }

  await docClient.send(
    new DeleteCommand({
      TableName: process.env.EVENTS_TABLE!,
      Key: { eventId },
    })
  );

  return response(200, { message: 'Event deleted successfully' });
}

export const handler = async (event: any) => {
  console.log('Events event:', JSON.stringify(event, null, 2));

  try {
    const httpMethod = event.httpMethod;
    const pathParameters = event.pathParameters || {};
    const eventId = pathParameters.id;
    const userId = event.requestContext?.authorizer?.userId;

    switch (httpMethod) {
      case 'GET':
        if (eventId) {
          return await getEvent(eventId);
        } else {
          return await listEvents(event);
        }

      case 'POST':
        if (!userId) {
          return response(401, { error: 'Unauthorized' });
        }
        return await createEvent(event, userId);

      case 'PUT':
        if (!userId) {
          return response(401, { error: 'Unauthorized' });
        }
        if (!eventId) {
          return response(400, { error: 'Event ID required' });
        }
        return await updateEvent(eventId, event, userId);

      case 'DELETE':
        if (!userId) {
          return response(401, { error: 'Unauthorized' });
        }
        if (!eventId) {
          return response(400, { error: 'Event ID required' });
        }
        return await deleteEvent(eventId, userId);

      default:
        return response(405, { error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Events error:', error);
    return response(500, { error: 'Internal server error' });
  }
};

