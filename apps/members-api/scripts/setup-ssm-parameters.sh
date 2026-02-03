#!/bin/bash
# Setup script for AWS SSM parameters required by the Members API

set -e

echo "Setting up AWS SSM parameters for Alles Standard Members API..."
echo ""

# Check if AWS CLI is configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo "Error: AWS CLI is not configured. Please run 'aws configure' first."
    exit 1
fi

# Generate a random JWT secret if not provided
if [ -z "$JWT_SECRET" ]; then
    JWT_SECRET=$(openssl rand -base64 32)
    echo "Generated JWT secret: $JWT_SECRET"
fi

# Check for Discord credentials
if [ -z "$DISCORD_CLIENT_ID" ]; then
    echo "Error: DISCORD_CLIENT_ID environment variable is not set."
    echo "Please set it: export DISCORD_CLIENT_ID=your_client_id"
    exit 1
fi

if [ -z "$DISCORD_CLIENT_SECRET" ]; then
    echo "Error: DISCORD_CLIENT_SECRET environment variable is not set."
    echo "Please set it: export DISCORD_CLIENT_SECRET=your_client_secret"
    exit 1
fi

# Create or update SSM parameters
echo "Creating SSM parameters..."

aws ssm put-parameter \
    --name "/alles-standard/jwt-secret" \
    --value "$JWT_SECRET" \
    --type SecureString \
    --overwrite \
    --description "JWT secret for Alles Standard member authentication"

aws ssm put-parameter \
    --name "/alles-standard/discord-client-id" \
    --value "$DISCORD_CLIENT_ID" \
    --type String \
    --overwrite \
    --description "Discord OAuth client ID"

aws ssm put-parameter \
    --name "/alles-standard/discord-client-secret" \
    --value "$DISCORD_CLIENT_SECRET" \
    --type SecureString \
    --overwrite \
    --description "Discord OAuth client secret"

echo ""
echo "✅ SSM parameters created successfully!"
echo ""
echo "Parameters created:"
echo "  - /alles-standard/jwt-secret"
echo "  - /alles-standard/discord-client-id"
echo "  - /alles-standard/discord-client-secret"
echo ""
echo "You can now deploy the CDK stack with: npm run deploy"
