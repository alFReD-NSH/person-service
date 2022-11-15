import PersonApi from './person-api'
import * as cdk from 'aws-cdk-lib';
import {RemovalPolicy} from 'aws-cdk-lib';
import {Construct} from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambda_nodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import {StreamViewType} from 'aws-cdk-lib/aws-dynamodb';
import * as events from 'aws-cdk-lib/aws-events';
import * as events_targets from 'aws-cdk-lib/aws-events-targets';
import * as logs from 'aws-cdk-lib/aws-logs';
import {DynamoDBStreamsToLambda} from '@aws-solutions-constructs/aws-dynamodbstreams-lambda';

interface CloudWatchEvent {
    detailType: string;
    source: string;
}

export class PersonServiceStack extends cdk.Stack {
    lambdaDefaultProps: lambda_nodejs.NodejsFunctionProps = {
        logRetention: logs.RetentionDays.ONE_DAY,
        runtime: lambda.Runtime.NODEJS_16_X,
    };

    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const defaultEventBus = events.EventBus.fromEventBusName(this, 'default-event-bus', 'default');
        const createPersonEvent: CloudWatchEvent = {
            source: 'person-api',
            detailType: 'person-created-event',
        };
        const table = this.createTable(defaultEventBus, createPersonEvent);
        this.createEventDebugLogGroup(defaultEventBus, createPersonEvent);
        new PersonApi(this, table, this.lambdaDefaultProps);
    }

    /**
     * Creates the Dynamodb Table with a lambda that publishes given event to eventbridge on inserts
     */
    createTable(eventBus: events.IEventBus, event: CloudWatchEvent) {
        const dynamodbTable = new dynamodb.Table(this, 'person-table', {
            partitionKey: {name: 'id', type: dynamodb.AttributeType.STRING},
            stream: StreamViewType.NEW_IMAGE,
            removalPolicy: RemovalPolicy.DESTROY // never do this for actual production code!
        });
        const publishCreateEventFn = new lambda_nodejs.NodejsFunction(this, 'publish-create-event', {
            environment: {
                EVENTBUS_NAME: eventBus.eventBusName,
                EVENT_NAME: event.detailType,
                EVENT_SOURCE: event.source
            },
            ...this.lambdaDefaultProps
        });
        eventBus.grantPutEventsTo(publishCreateEventFn);
        new DynamoDBStreamsToLambda(this, 'dynamodbstreams-lambda', {
            existingLambdaObj: publishCreateEventFn,
            existingTableInterface: dynamodbTable
        });
        return dynamodbTable;
    }

    /**
     * Create a log group to see if anything is published to the event bridge with given event
     * source and detailType.
     * @param eventBus
     * @param event
     */
    createEventDebugLogGroup(eventBus: events.IEventBus, event: CloudWatchEvent) {
        const name = `${event.source}-${event.detailType}-debug`
        const logGroup = new logs.LogGroup(this, `${name}-log`, {
            retention: logs.RetentionDays.ONE_DAY
        });

        const rule = new events.Rule(this, `${name}-rule`, {
            eventBus: eventBus,
            eventPattern: {
                source: [event.source],
                detailType: [event.detailType]
            },
        });

        rule.addTarget(new events_targets.CloudWatchLogGroup(logGroup));
    }
}