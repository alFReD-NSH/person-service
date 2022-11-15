# Person API

This is a project created AWS CDK with TypeScript.

## Design Decisions

- Validation is done on the API Gateway. API Gateway provides a lot of managed functionality. 
  Likely it's functionality has less bugs than my code, so I rely on it.
- For simplicity kept the Lambdas to single function single file, however if further logic 
  should be added, they might need to be broken down further.
- The API Gateway and the Lambda functions for it are in their own file just so things are 
  organized a little.
- DynamoDB streams with a Lambda function handler was used to so the publishing of the created 
  event doesn't get in the way of create person API and it is also with a very reliable pattern
- Production and development are exact replica so we can always ensure problems of production 
  can be replicated in development and vice versa. However this may not be great money and 
  security wise.
- Cloudwatch Events was chosen as the event pub/sub platform due to the ease subscribing to 
  events with a certain pattern making it more scalable to use across teams, however it is more 
  expensive than SNS since it has more functionality.
- A Cloudwatch log group is created as a sink for the created event so we can see if it works or 
  not.
- API Gateway v1 was chosen for it's good support in CDK.
- The create-person and list-person lambdas could have been avoided by making API Gateway call 
  Dynamodb directly making it cheaper and more reliable but the API Gateway templating language is 
  somewhat obsecure and I can't make something good out of it without spending hours debugging. 

## What's missing?

- Tests!
- Cost controls.
  - The API gateway is public on the net. With a crazy bot, it can cost quite a lot. It should 
    be throttled to what we are willing to pay.
  - DynamoDB is now using provisioned capacity of 5 for read and write and on demand may be 
    cheaper.
- Security
  - Public API Gateway with no authentication? IAM authorizer is my default recommendation. 
    Getting all the clients IAM credentials? Maybe not an easy tasks sometimes though. 
- Monitoring! No alarms, no one to notice something went wrong.
- No pagination or limits for the list person API. As new persons are created, list API will 
  return all persons and at some point it could grow so large that it's response would exceed 
  API Gateway or Lambda limits and the API gateway would be returning 500 errors instead!

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `cdk deploy`      deploy this stack to your default AWS account/region
* `cdk diff`        compare deployed stack with current state
* `cdk synth`       emits the synthesized CloudFormation template
