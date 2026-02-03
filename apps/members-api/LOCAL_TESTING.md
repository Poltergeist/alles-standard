# Local Development Testing Guide

## Prerequisites

1. **Docker Desktop** - Install from [docker.com](https://www.docker.com/products/docker-desktop/)
2. **AWS SAM CLI** - Install with:
   ```bash
   brew install aws-sam-cli
   ```
3. **LocalStack AWS CLI** - Install with:
   ```bash
   pip install awscli-local
   ```

## Setup Steps

### 1. Start LocalStack (DynamoDB + SSM)

```bash
cd apps/members-api
npm run local:start
```

This will:
- Start LocalStack in Docker
- Create DynamoDB tables (users, events, decklists)
- Create SSM parameters (JWT secret, Discord credentials)
- Verify everything is running

### 2. Install Lambda Dependencies

```bash
npm run local:install-deps
```

This installs `node_modules` for each Lambda function.

### 3. Configure Discord OAuth (Optional for full flow)

If you want to test the full Discord OAuth flow:

1. Create a Discord app at https://discord.com/developers/applications
2. Add redirect URI: `http://localhost:4321/members/callback/`
3. Update `.env.local` in `apps/web/` with your client ID
4. Update LocalStack SSM parameters:
   ```bash
   docker exec alles-standard-localstack awslocal ssm put-parameter \
     --name "/alles-standard/discord-client-id" \
     --value "YOUR_CLIENT_ID" \
     --overwrite
   
   docker exec alles-standard-localstack awslocal ssm put-parameter \
     --name "/alles-standard/discord-client-secret" \
     --value "YOUR_CLIENT_SECRET" \
     --type SecureString \
     --overwrite
   ```

### 4. Start SAM Local API

In a new terminal:

```bash
cd apps/members-api
npm run local:api
```

This starts API Gateway locally on **http://localhost:3000**

### 5. Start Astro Frontend

In another terminal:

```bash
cd apps/web
npm run dev
```

This starts the Astro site on **http://localhost:4321**

## Testing

### Test DynamoDB Connection

```bash
# List tables
docker exec alles-standard-localstack awslocal dynamodb list-tables

# Scan users table
docker exec alles-standard-localstack awslocal dynamodb scan \
  --table-name alles-standard-users
```

### Test API Endpoints

```bash
# Test public endpoint (list decklists)
curl http://localhost:3000/decklists

# Test public endpoint (list events)
curl http://localhost:3000/events
```

### Test Full Flow

1. Open **http://localhost:4321/members/login/**
2. Click "Login with Discord"
3. Complete OAuth flow
4. You should land on the dashboard
5. Try submitting a decklist or event

### Test Lambda Functions Directly

You can invoke Lambdas directly:

```bash
# Test moxfield fetcher
sam local invoke MoxfieldFetcherFunction \
  --event test-events/moxfield-event.json \
  --env-vars .env.local
```

## Viewing Logs

### LocalStack Logs
```bash
npm run local:logs
```

### SAM Local Logs
Logs appear in the terminal where you ran `npm run local:api`

## Troubleshooting

### LocalStack won't start
```bash
# Stop and remove containers
npm run local:stop
docker ps -a
docker rm alles-standard-localstack

# Start fresh
npm run local:start
```

### Lambda can't connect to DynamoDB
Make sure SAM is using the same Docker network:
```bash
npm run local:api
# Should include: --docker-network alles-standard-local
```

### Port already in use
```bash
# Check what's using port 4566 or 3000
lsof -i :4566
lsof -i :3000

# Kill the process or change ports in docker-compose.yml
```

## Cleanup

Stop LocalStack:
```bash
npm run local:stop
```

## Architecture

```
┌─────────────────────┐
│  Astro Frontend     │
│  localhost:4321     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  SAM Local API      │
│  localhost:3000     │
│  - API Gateway      │
│  - Lambda Functions │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  LocalStack         │
│  localhost:4566     │
│  - DynamoDB         │
│  - SSM Parameters   │
└─────────────────────┘
```

## What Can't Be Tested Locally

- **Discord OAuth redirect** - Discord only allows HTTPS or localhost, but you can mock the callback
- **Production IAM policies** - LocalStack IAM is simplified
- **CloudWatch metrics** - Not available in LocalStack free tier
- **Real moxfield.com API** - This works! It's just HTTP requests

## Next Steps

Once local testing works, deploy to AWS:
```bash
cd apps/members-api

# Set up real SSM parameters
./scripts/setup-ssm-parameters.sh

# Deploy
npm run deploy
```
