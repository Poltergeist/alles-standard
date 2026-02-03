#!/bin/bash

echo "Initializing LocalStack resources..."

# Create DynamoDB tables
awslocal dynamodb create-table \
    --table-name alles-standard-users \
    --attribute-definitions AttributeName=userId,AttributeType=S \
    --key-schema AttributeName=userId,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST

awslocal dynamodb create-table \
    --table-name alles-standard-events \
    --attribute-definitions \
        AttributeName=eventId,AttributeType=S \
        AttributeName=date,AttributeType=S \
    --key-schema AttributeName=eventId,KeyType=HASH \
    --global-secondary-indexes \
        "[{\"IndexName\":\"date-index\",\"KeySchema\":[{\"AttributeName\":\"date\",\"KeyType\":\"HASH\"},{\"AttributeName\":\"eventId\",\"KeyType\":\"RANGE\"}],\"Projection\":{\"ProjectionType\":\"ALL\"}}]" \
    --billing-mode PAY_PER_REQUEST

awslocal dynamodb create-table \
    --table-name alles-standard-decklists \
    --attribute-definitions \
        AttributeName=decklistId,AttributeType=S \
        AttributeName=userId,AttributeType=S \
        AttributeName=createdAt,AttributeType=S \
        AttributeName=eventId,AttributeType=S \
        AttributeName=rank,AttributeType=N \
    --key-schema AttributeName=decklistId,KeyType=HASH \
    --global-secondary-indexes \
        "[{\"IndexName\":\"userId-createdAt-index\",\"KeySchema\":[{\"AttributeName\":\"userId\",\"KeyType\":\"HASH\"},{\"AttributeName\":\"createdAt\",\"KeyType\":\"RANGE\"}],\"Projection\":{\"ProjectionType\":\"ALL\"}},{\"IndexName\":\"eventId-rank-index\",\"KeySchema\":[{\"AttributeName\":\"eventId\",\"KeyType\":\"HASH\"},{\"AttributeName\":\"rank\",\"KeyType\":\"RANGE\"}],\"Projection\":{\"ProjectionType\":\"ALL\"}}]" \
    --billing-mode PAY_PER_REQUEST

# Create SSM parameters
awslocal ssm put-parameter \
    --name "/alles-standard/jwt-secret" \
    --value "local-dev-jwt-secret-change-in-production" \
    --type SecureString

awslocal ssm put-parameter \
    --name "/alles-standard/discord-client-id" \
    --value "your-discord-client-id" \
    --type String

awslocal ssm put-parameter \
    --name "/alles-standard/discord-client-secret" \
    --value "your-discord-client-secret" \
    --type SecureString

echo "✅ LocalStack initialization complete!"
