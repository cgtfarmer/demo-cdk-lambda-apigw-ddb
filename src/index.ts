// Runtime: Node.js 18.x

import { randomUUID } from 'crypto';
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2, Context, Handler } from 'aws-lambda';
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  ScanCommand,
  PutCommand,
  GetCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";

export const handler: Handler =
  async ( event: APIGatewayProxyEventV2, context: Context): Promise<APIGatewayProxyResultV2> => {

  const ddbTableName: string = process.env.DDB_TABLE_NAME || '';

  console.log(`DDB Table Name env var: ${ddbTableName}`);
  console.log(event);

  const headers = {
    'Content-Type': 'application/json',
  };

  const client = new DynamoDBClient({});

  const dynamo = DynamoDBDocumentClient.from(client);

  const eventId = event.pathParameters?.id || '?';
  const eventBody = event.body || '?';

  let ddbResponse;
  let response;
  let body;
  let requestJson;
  switch (event.routeKey) {
    case "GET /users":
      ddbResponse = await dynamo.send(
        new ScanCommand({ TableName: ddbTableName })
      );

      body = ddbResponse.Items;

      response = {
        statusCode: 200,
        headers: headers,
        body: JSON.stringify(body),
      };

      dynamo.destroy();
      client.destroy();
      return response;

    case "POST /users":
      requestJson = JSON.parse(eventBody);

      body = {
        pk: randomUUID(),
        firstName: requestJson.firstName,
        lastName: requestJson.lastName,
        age: requestJson.age,
        weight: requestJson.weight,
        smoker: requestJson.smoker,
      }

      await dynamo.send(
        new PutCommand({
          TableName: ddbTableName,
          Item: body,
        })
      );

      response = {
        statusCode: 201,
        headers: headers,
        body: JSON.stringify(body),
      };

      dynamo.destroy();
      client.destroy();
      return response;

    case "GET /users/{id}":
      ddbResponse = await dynamo.send(
        new GetCommand({
          TableName: ddbTableName,
          Key: {
            pk: eventId,
          },
        })
      );

      body = ddbResponse.Item;

      response = {
        statusCode: 200,
        headers: headers,
        body: JSON.stringify(body),
      };

      dynamo.destroy();
      client.destroy();
      return response;

    case "PUT /users/{id}":
      requestJson = JSON.parse(eventBody);

      body = {
        pk: eventId,
        firstName: requestJson.firstName,
        lastName: requestJson.lastName,
        age: requestJson.age,
        weight: requestJson.weight,
        smoker: requestJson.smoker,
      }

      await dynamo.send(
        new PutCommand({
          TableName: ddbTableName,
          Item: body,
        })
      );

      response = {
        statusCode: 200,
        headers: headers,
        body: JSON.stringify(body),
      };

      dynamo.destroy();
      client.destroy();
      return response;

    case "DELETE /users/{id}":
      await dynamo.send(
        new DeleteCommand({
          TableName: ddbTableName,
          Key: {
            pk: eventId,
          },
        })
      );

      response = {
        statusCode: 200,
        headers: headers,
        body: JSON.stringify({
          message: `ID: ${eventId} deleted successfully`
        }),
      };

      dynamo.destroy();
      client.destroy();
      return response;
  }

  dynamo.destroy();
  client.destroy();
  throw new Error(`Unsupported route: "${event.routeKey}"`);
}
