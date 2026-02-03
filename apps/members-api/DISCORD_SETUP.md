# Discord OAuth Application Setup

## Create Discord Application

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application"
3. Name it "Alles Standard Member Area"
4. Go to "OAuth2" section
5. Add redirect URIs:
   - For local development: `http://localhost:4321/members/callback/`
   - For production: `https://alles-standard.social/members/callback/`
6. Copy the **Client ID** and **Client Secret**

## Configure SSM Parameters

Set environment variables and run the setup script:

```bash
export DISCORD_CLIENT_ID="your_client_id_here"
export DISCORD_CLIENT_SECRET="your_client_secret_here"
./scripts/setup-ssm-parameters.sh
```

The script will:
- Generate a secure random JWT secret
- Store all secrets in AWS Systems Manager Parameter Store
- Validate AWS CLI is configured

## OAuth Scopes Required

The application requires these Discord OAuth scopes:
- `identify` - Read user profile (username, ID, avatar)
- `email` - Read user email (optional, for future features)

## Redirect Flow

1. User clicks "Login with Discord" on frontend
2. User redirected to Discord OAuth page
3. User authorizes the application
4. Discord redirects back to `/members/callback/?code=...`
5. Frontend calls `/auth/callback` Lambda with the code
6. Lambda exchanges code for Discord user info
7. Lambda returns JWT token
8. Frontend stores JWT and uses it for authenticated requests
