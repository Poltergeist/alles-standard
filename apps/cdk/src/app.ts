#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { BillingStack } from '../lib/billing-stack';

const app = new cdk.App();

new BillingStack(app, 'MCPServerBillingStack', {
  env: {
    region: 'eu-central-1',
  },
  description: 'Billing group for MCP-SERVER project resources',
});

app.synth();
