import {Context, DynamoDBStreamEvent} from 'aws-lambda';
import {AttributeValue} from "@aws-sdk/client-dynamodb";
import {CloudWatchEvents} from '@aws-sdk/client-cloudwatch-events'
import { unmarshall } from '@aws-sdk/util-dynamodb';

const events = new CloudWatchEvents({apiVersion: '2022-04-07'})
const eventBusName = process.env.EVENTBUS_NAME as string
const eventName = process.env.EVENT_NAME as string
const eventSource = process.env.EVENT_SOURCE as string

export async function handler(event: DynamoDBStreamEvent, context: Context) {
    await events.putEvents({
        Entries: event.Records
            .filter(record => record.eventName == 'INSERT')
            .map(record => {
                // AttributeValue type of aws-lambda is not compatible with AttributeValue type of
                // aws-sdk!
                const detail = record.dynamodb?.NewImage as { [key: string]: AttributeValue };
                return {
                    Detail: JSON.stringify(unmarshall(detail)),
                    DetailType: eventName,
                    EventBusName: eventBusName,
                    Source: eventSource,
                }
            })
    })
}