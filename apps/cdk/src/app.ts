#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';

const app = new cdk.App();

// For cost tracking, tag your resources with: project=MCP-SERVER
// Then use AWS Cost Explorer to filter by this tag

app.synth();
