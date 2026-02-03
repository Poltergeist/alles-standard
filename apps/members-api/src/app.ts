#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { MembersApiStack } from './members-api-stack';

const app = new cdk.App();

new MembersApiStack(app, 'AllesStandardMembersApiStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'eu-central-1',
  },
  tags: {
    Project: 'AllesStandard',
    Component: 'MembersAPI',
  },
});

app.synth();
