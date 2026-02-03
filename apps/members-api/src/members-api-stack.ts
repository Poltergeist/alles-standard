import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import * as path from 'path';

export class MembersApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // DynamoDB Tables
    const usersTable = new dynamodb.Table(this, 'UsersTable', {
      tableName: 'alles-standard-users',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      pointInTimeRecovery: true,
    });

    const eventsTable = new dynamodb.Table(this, 'EventsTable', {
      tableName: 'alles-standard-events',
      partitionKey: { name: 'eventId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      pointInTimeRecovery: true,
    });

    eventsTable.addGlobalSecondaryIndex({
      indexName: 'date-index',
      partitionKey: { name: 'date', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'eventId', type: dynamodb.AttributeType.STRING },
    });

    const decklistsTable = new dynamodb.Table(this, 'DecklistsTable', {
      tableName: 'alles-standard-decklists',
      partitionKey: { name: 'decklistId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      pointInTimeRecovery: true,
    });

    decklistsTable.addGlobalSecondaryIndex({
      indexName: 'userId-createdAt-index',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
    });

    decklistsTable.addGlobalSecondaryIndex({
      indexName: 'eventId-rank-index',
      partitionKey: { name: 'eventId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'rank', type: dynamodb.AttributeType.NUMBER },
    });

    // API Gateway
    const api = new apigateway.RestApi(this, 'MembersApi', {
      restApiName: 'Alles Standard Members API',
      description: 'API for member submissions and public data access',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization'],
      },
      deployOptions: {
        stageName: 'prod',
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        tracingEnabled: true,
      },
    });

    // Lambda Layer for shared dependencies
    const sharedLayer = new lambda.LayerVersion(this, 'SharedLayer', {
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda-layers/shared')),
      compatibleRuntimes: [lambda.Runtime.NODEJS_20_X],
      description: 'Shared dependencies for member API lambdas',
    });

    // Environment variables for all Lambdas
    const lambdaEnvironment = {
      USERS_TABLE: usersTable.tableName,
      EVENTS_TABLE: eventsTable.tableName,
      DECKLISTS_TABLE: decklistsTable.tableName,
      JWT_SECRET_PARAM: '/alles-standard/jwt-secret',
      DISCORD_CLIENT_ID_PARAM: '/alles-standard/discord-client-id',
      DISCORD_CLIENT_SECRET_PARAM: '/alles-standard/discord-client-secret',
      FRONTEND_URL: 'https://alles-standard.social',
    };

    // Lambda Functions
    const moxfieldFetcherFunction = new lambda.Function(this, 'MoxfieldFetcherFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda/moxfield-fetcher')),
      environment: lambdaEnvironment,
      timeout: cdk.Duration.seconds(60),
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    const authCallbackFunction = new lambda.Function(this, 'AuthCallbackFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda/auth-callback')),
      environment: lambdaEnvironment,
      timeout: cdk.Duration.seconds(30),
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    const authorizerFunction = new lambda.Function(this, 'AuthorizerFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda/authorizer')),
      environment: lambdaEnvironment,
      timeout: cdk.Duration.seconds(10),
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    const decklistsFunction = new lambda.Function(this, 'DecklistsFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda/decklists')),
      environment: {
        ...lambdaEnvironment,
        MOXFIELD_FETCHER_FUNCTION: moxfieldFetcherFunction.functionName,
      },
      timeout: cdk.Duration.seconds(30),
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    const eventsFunction = new lambda.Function(this, 'EventsFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda/events')),
      environment: lambdaEnvironment,
      timeout: cdk.Duration.seconds(30),
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    // Grant DynamoDB permissions
    usersTable.grantReadWriteData(authCallbackFunction);
    usersTable.grantReadData(authorizerFunction);
    decklistsTable.grantReadWriteData(decklistsFunction);
    decklistsTable.grantWriteData(moxfieldFetcherFunction);
    eventsTable.grantReadWriteData(eventsFunction);

    // Grant Lambda invoke permissions
    moxfieldFetcherFunction.grantInvoke(decklistsFunction);

    // Grant SSM Parameter Store read permissions
    const ssmReadPolicy = new cdk.aws_iam.PolicyStatement({
      actions: ['ssm:GetParameter'],
      resources: [
        `arn:aws:ssm:${this.region}:${this.account}:parameter/alles-standard/*`,
      ],
    });

    authCallbackFunction.addToRolePolicy(ssmReadPolicy);
    authorizerFunction.addToRolePolicy(ssmReadPolicy);

    // Lambda Authorizer
    const authorizer = new apigateway.TokenAuthorizer(this, 'JwtAuthorizer', {
      handler: authorizerFunction,
      identitySource: 'method.request.header.Authorization',
      resultsCacheTtl: cdk.Duration.minutes(5),
    });

    // API Routes - Auth
    const authResource = api.root.addResource('auth');
    const authCallbackResource = authResource.addResource('callback');
    authCallbackResource.addMethod('GET', new apigateway.LambdaIntegration(authCallbackFunction));

    // API Routes - Decklists
    const decklistsResource = api.root.addResource('decklists');
    decklistsResource.addMethod('GET', new apigateway.LambdaIntegration(decklistsFunction));
    decklistsResource.addMethod('POST', new apigateway.LambdaIntegration(decklistsFunction), {
      authorizer,
    });

    const decklistResource = decklistsResource.addResource('{id}');
    decklistResource.addMethod('GET', new apigateway.LambdaIntegration(decklistsFunction));
    decklistResource.addMethod('PUT', new apigateway.LambdaIntegration(decklistsFunction), {
      authorizer,
    });
    decklistResource.addMethod('DELETE', new apigateway.LambdaIntegration(decklistsFunction), {
      authorizer,
    });

    // API Routes - Events
    const eventsResource = api.root.addResource('events');
    eventsResource.addMethod('GET', new apigateway.LambdaIntegration(eventsFunction));
    eventsResource.addMethod('POST', new apigateway.LambdaIntegration(eventsFunction), {
      authorizer,
    });

    const eventResource = eventsResource.addResource('{id}');
    eventResource.addMethod('GET', new apigateway.LambdaIntegration(eventsFunction));
    eventResource.addMethod('PUT', new apigateway.LambdaIntegration(eventsFunction), {
      authorizer,
    });
    eventResource.addMethod('DELETE', new apigateway.LambdaIntegration(eventsFunction), {
      authorizer,
    });

    // Outputs
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'API Gateway URL',
      exportName: 'AllesStandardApiUrl',
    });

    new cdk.CfnOutput(this, 'UsersTableName', {
      value: usersTable.tableName,
      description: 'Users DynamoDB Table',
    });

    new cdk.CfnOutput(this, 'EventsTableName', {
      value: eventsTable.tableName,
      description: 'Events DynamoDB Table',
    });

    new cdk.CfnOutput(this, 'DecklistsTableName', {
      value: decklistsTable.tableName,
      description: 'Decklists DynamoDB Table',
    });
  }
}
