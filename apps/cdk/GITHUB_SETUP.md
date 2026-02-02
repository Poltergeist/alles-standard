# GitHub Configuration for CDK Automatic Deployment

To enable automatic CDK deployments via GitHub Actions, you need to configure the following:

## 1. AWS IAM Setup

### Create an OIDC Identity Provider (One-time setup)

1. Go to **AWS Console** → **IAM** → **Identity providers**
2. Click **Add provider**
3. Choose **OpenID Connect**
4. Provider URL: `https://token.actions.githubusercontent.com`
5. Audience: `sts.amazonaws.com`
6. Click **Add provider**

### Create an IAM Role for GitHub Actions

1. Go to **IAM** → **Roles** → **Create role**
2. Choose **Web identity**
3. Select the OIDC provider you just created
4. Audience: `sts.amazonaws.com`
5. Click **Next**

6. Attach the following policies (or create a custom policy):
   - `AWSBillingConductorFullAccess` (for billing group management)
   - Alternatively, create a custom policy with these permissions:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "billingconductor:*",
           "cloudformation:*",
           "s3:*",
           "iam:PassRole"
         ],
         "Resource": "*"
       }
     ]
   }
   ```

7. Name the role (e.g., `GitHubActionsCDKDeployRole`)

8. After creation, edit the **Trust relationship** to restrict to your repository:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Principal": {
           "Federated": "arn:aws:iam::YOUR_ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com"
         },
         "Action": "sts:AssumeRoleWithWebIdentity",
         "Condition": {
           "StringEquals": {
             "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
           },
           "StringLike": {
             "token.actions.githubusercontent.com:sub": "repo:YOUR_GITHUB_USERNAME/alles-standard:*"
           }
         }
       }
     ]
   }
   ```

## 2. GitHub Secrets Setup

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add the following secret:

   **Name:** `AWS_ROLE_ARN`  
   **Value:** The ARN of the IAM role you created (e.g., `arn:aws:iam::123456789012:role/GitHubActionsCDKDeployRole`)

## 3. Bootstrap CDK (One-time setup per region)

Before the first deployment, you need to bootstrap CDK in your AWS account for the eu-central-1 region:

```bash
# Locally, with AWS credentials configured
cd apps/cdk
npx cdk bootstrap aws://ACCOUNT-ID/eu-central-1
```

Replace `ACCOUNT-ID` with your AWS account ID.

## 4. Trigger Deployment

Once configured, the CDK stack will automatically deploy when:
- You push changes to the `apps/cdk/` directory on the `main` branch
- You manually trigger the workflow from the **Actions** tab

## What Gets Deployed

The CDK stack creates:
- A billing group named `mcp-server-billing-group`
- Configuration to track costs for resources tagged with `project=MCP-SERVER`

## Tagging Resources

To have resources tracked by this billing group, tag them with:
```
project = MCP-SERVER
```

This can be done when creating resources via CDK, CloudFormation, or manually in the AWS Console.
