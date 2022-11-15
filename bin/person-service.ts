#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { PersonServiceStack } from '../lib/person-service-stack';

const app = new cdk.App();
new PersonServiceStack(app, 'PersonServiceStack-dev', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION
  },
});

new PersonServiceStack(app, 'PersonServiceStack-prod', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION
  },
});