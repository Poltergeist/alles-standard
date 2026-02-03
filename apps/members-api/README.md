# Members API

Serverless backend API for Alles Standard member area.

## Architecture

- **API Gateway**: REST API for public and authenticated endpoints
- **Lambda Functions**: Serverless compute for business logic
- **DynamoDB**: NoSQL database for users, events, decklists
- **Discord OAuth**: Authentication via Discord
- **Moxfield Integration**: Fetch decklist data from moxfield.com

## Quick Start

### Local Development

1. **Prerequisites:**
   ```bash
   brew install docker aws-sam-cli
   pip install awscli-local
   ```

2. **Start LocalStack:**
   ```bash
   npm run local:start
   ```

3. **Install Lambda dependencies:**
   ```bash
   npm run local:install-deps
   ```

4. **Start SAM Local API:**
   ```bash
   npm run local:api
   ```

5. **Start Astro frontend (separate terminal):**
   ```bash
   cd ../web && npm run dev
   ```

See [LOCAL_TESTING.md](./LOCAL_TESTING.md) for detailed instructions.

### Production Deployment

1. **Set up Discord OAuth:**
   - Follow [DISCORD_SETUP.md](./DISCORD_SETUP.md)

2. **Configure AWS credentials:**
   ```bash
   aws configure
   ```

3. **Set up SSM parameters:**
   ```bash
   export DISCORD_CLIENT_ID="your_client_id"
   export DISCORD_CLIENT_SECRET="your_client_secret"
   ./scripts/setup-ssm-parameters.sh
   ```

4. **Build and deploy:**
   ```bash
   npm run build
   npm run deploy
   ```

## API Endpoints

### Public Endpoints
- `GET /decklists` - List all decklists
- `GET /decklists/{id}` - Get single decklist
- `GET /events` - List all events
- `GET /events/{id}` - Get single event

### Authenticated Endpoints (require JWT)
- `POST /decklists` - Submit new decklist
- `PUT /decklists/{id}` - Update decklist
- `DELETE /decklists/{id}` - Delete decklist
- `POST /events` - Create event
- `PUT /events/{id}` - Update event
- `DELETE /events/{id}` - Delete event

### Auth Endpoints
- `GET /auth/callback` - Discord OAuth callback

## Development Scripts

```bash
npm run build              # Build TypeScript
npm run synth              # Synthesize CloudFormation
npm run deploy             # Deploy to AWS
npm run local:start        # Start LocalStack
npm run local:api          # Start SAM Local API
npm run local:install-deps # Install Lambda dependencies
npm run local:stop         # Stop LocalStack
```

## Project Structure

```
apps/members-api/
├── src/
│   ├── app.ts                    # CDK app entry point
│   └── members-api-stack.ts      # Infrastructure stack
├── lambda/
│   ├── auth-callback/            # Discord OAuth handler
│   ├── authorizer/               # JWT validator
│   ├── decklists/                # Decklists CRUD
│   ├── events/                   # Events CRUD
│   └── moxfield-fetcher/         # Moxfield API integration
├── scripts/
│   ├── setup-ssm-parameters.sh   # Production secrets setup
│   ├── start-local.sh            # Start local environment
│   ├── stop-local.sh             # Stop local environment
│   └── install-lambda-deps.sh    # Install Lambda dependencies
├── test-events/                  # Sample Lambda events
├── localstack-init/              # LocalStack initialization
├── docker-compose.yml            # LocalStack configuration
├── template.yaml                 # SAM template for local testing
├── .env.local                    # Local environment variables
├── LOCAL_TESTING.md              # Local testing guide
├── DISCORD_SETUP.md              # Discord OAuth setup
└── README.md                     # This file
```

## Environment Variables

### Production (AWS SSM)
- `/alles-standard/jwt-secret` - JWT signing secret
- `/alles-standard/discord-client-id` - Discord OAuth client ID
- `/alles-standard/discord-client-secret` - Discord OAuth secret

### Local (.env.local)
- `AWS_ENDPOINT_URL=http://localhost:4566`
- `USERS_TABLE=alles-standard-users`
- `EVENTS_TABLE=alles-standard-events`
- `DECKLISTS_TABLE=alles-standard-decklists`
- `FRONTEND_URL=http://localhost:4321`

## Testing

### Local Testing
```bash
# Start environment
npm run local:start

# Test Lambda directly
sam local invoke DecklistsFunction \
  --event test-events/list-decklists.json \
  --env-vars .env.local

# Test via API
curl http://localhost:3000/decklists
```

### Integration Testing
See [LOCAL_TESTING.md](./LOCAL_TESTING.md) for comprehensive testing guide.

## Troubleshooting

### Build Errors
```bash
# Clean and rebuild
rm -rf dist cdk.out
npm run build
```

### LocalStack Issues
```bash
# Restart LocalStack
npm run local:stop
docker ps -a  # Check for stale containers
docker rm alles-standard-localstack
npm run local:start
```

### Lambda Errors
```bash
# Check Lambda has dependencies
ls lambda/decklists/node_modules/
npm run local:install-deps
```

## Documentation

- [LOCAL_TESTING.md](./LOCAL_TESTING.md) - Complete local development guide
- [DISCORD_SETUP.md](./DISCORD_SETUP.md) - Discord OAuth configuration
- [Phase 1 Summary](../../.copilot/session-state/.../phase1-complete.md) - Infrastructure setup
- [Phase 2 Summary](../../.copilot/session-state/.../phase2-complete.md) - Authentication implementation

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│  Static Site (GitHub Pages / localhost:4321)                │
│  - Astro SSG                                                 │
│  - Client-side auth                                          │
└─────────┬─────────────────────────────────────────┬─────────┘
          │                                         │
          │ OAuth                                   │ API Calls
          │                                         │
          ▼                                         ▼
┌─────────────────┐                    ┌──────────────────────┐
│  Discord OAuth  │                    │   API Gateway        │
│  Authorization  │                    │   (SAM Local:3000)   │
└─────────────────┘                    │   - JWT Authorizer   │
                                       │   - CORS enabled     │
                                       └──────────┬───────────┘
                                                  │
                        ┌─────────────────────────┼─────────────────────┐
                        ▼                         ▼                     ▼
              ┌─────────────────┐     ┌─────────────────┐   ┌──────────────────┐
              │  Auth Lambda    │     │ Decklists       │   │  Events Lambda   │
              │  - OAuth        │     │ Lambda          │   │  - CRUD ops      │
              │  - JWT tokens   │     │ - CRUD ops      │   └──────────────────┘
              └─────────────────┘     │ - Trigger fetch │
                                       └─────────────────┘
                                                  │
                                                  │ Invoke
                                                  ▼
                                       ┌─────────────────┐
                                       │  Moxfield       │
                                       │  Fetcher        │
                                       │  Lambda         │
                                       └─────────────────┘
                                                  │
                ┌─────────────────────────────────┼─────────────────────┐
                ▼                                 ▼                     ▼
      ┌─────────────────┐            ┌─────────────────┐    ┌─────────────────┐
      │  Users Table    │            │ Decklists Table │    │  Events Table   │
      │  (DynamoDB)     │            │  (DynamoDB)     │    │  (DynamoDB)     │
      │  LocalStack     │            │  LocalStack     │    │  LocalStack     │
      └─────────────────┘            └─────────────────┘    └─────────────────┘
```

## License

ISC
