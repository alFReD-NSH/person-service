import {APIGatewayEvent, Context} from 'aws-lambda';
import {DynamoDB} from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';

const tableName = process.env.TABLE_NAME as string
const dynamodb = new DynamoDB({apiVersion: '2012-08-10'})

export async function handler(event: APIGatewayEvent, context: Context) {
    const results = await dynamodb.scan({
        TableName: tableName,
    });

    return {
        statusCode: 200,
        body: JSON.stringify(results.Items?.map(data => unmarshall(data))),
    };
}