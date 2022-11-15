import * as apigw from "aws-cdk-lib/aws-apigateway";
import {Construct} from "constructs";
import * as lambda_nodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

export default class PersonApi extends apigw.RestApi {
    constructor(scope: Construct,
                table: dynamodb.ITable,
                lambdaDefaultProps: lambda_nodejs.NodejsFunctionProps) {
        super(scope, 'person-api');

        this.addGatewayResponse('GatewayResponse', {
            type: apigw.ResponseType.BAD_REQUEST_BODY,
            templates: {
                'application/json': '{ "message": "$context.error.validationErrorString" }'
            }
        })
        const personsResource = this.root.addResource('persons')

        this.listPersonFn(personsResource, table, lambdaDefaultProps)
        this.createPersonFn(personsResource, table, lambdaDefaultProps)
    }

    listPersonFn(resource: apigw.Resource,
                 table: dynamodb.ITable,
                 lambdaDefaultProps: lambda_nodejs.NodejsFunctionProps) {
        const listPersonsFunction = new lambda_nodejs.NodejsFunction(this, 'list-persons', {
            environment: {
                TABLE_NAME: table.tableName
            },
            ...lambdaDefaultProps
        })
        table.grant(listPersonsFunction, 'dynamodb:Scan')
        resource.addMethod('GET', new apigw.LambdaIntegration(listPersonsFunction))
    }

    createPersonFn(resource: apigw.Resource,
                   table: dynamodb.ITable,
                   lambdaDefaultProps: lambda_nodejs.NodejsFunctionProps) {
        const createPersonFunction = new lambda_nodejs.NodejsFunction(this, 'create-person', {
            environment: {
                TABLE_NAME: table.tableName,
            },
            ...lambdaDefaultProps
        })
        table.grant(createPersonFunction, 'dynamodb:PutItem')

        const personModel = this.addModel('person-model', {
            schema: {
                title: 'Person',
                schema: apigw.JsonSchemaVersion.DRAFT4,
                type: apigw.JsonSchemaType.OBJECT,
                properties: {
                    firstName: {
                        type: apigw.JsonSchemaType.STRING,
                        minLength: 1,
                        maxLength: 1024 // Longest name in the world is 747. No discrimination!
                    },
                    lastName: {
                        type: apigw.JsonSchemaType.STRING,
                        maxLength: 1024 // Longest name in the world is 747. No discrimination!
                    },
                    phoneNumber: {
                        type: apigw.JsonSchemaType.STRING,
                        // Allows a phone number with formatting (dashes, brackets and spaces)
                        "pattern": "\\+?\\d[-() \\d]",
                        "maxLength": 45 // Longest phone number is 15, we add some room for formatting
                        // characters
                    },
                    address: {
                        type: apigw.JsonSchemaType.STRING,
                        minLength: 4,
                        maxLength: 1024 // Some addresses are a description on how to get there, and they
                        // could get long!
                    }
                },
                required: ['firstName', 'phoneNumber', 'address'],
                additionalProperties: false,
            }
        });

        resource.addMethod('POST', new apigw.LambdaIntegration(createPersonFunction), {
            requestModels: {
                'application/json': personModel,
            },
            requestValidatorOptions: {
                requestValidatorName: 'create-person-validator',
                validateRequestBody: true
            },
        });
    }
}