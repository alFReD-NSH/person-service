import {APIGatewayEvent, Context} from 'aws-lambda';
import {DynamoDB} from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';

const tableName = process.env.TABLE_NAME as string
const dynamodb = new DynamoDB({apiVersion: '2022-08-18'})

export async function handler(event: APIGatewayEvent, context: Context) {
    // Assuming API Gateway validation is tip top!
    const body = JSON.parse(event.body as string);

    body.id = event.requestContext.requestId; // To ensure repeated Lambda calls from the same
    // requests don't result in multiple items added to table.

    await dynamodb.putItem({
        TableName: tableName,
        Item: marshall(body),
    });

    return {
        statusCode: 201,
        body: JSON.stringify(body)
    };
}