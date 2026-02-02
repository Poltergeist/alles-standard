import * as cdk from 'aws-cdk-lib';
import * as billingconductor from 'aws-cdk-lib/aws-billingconductor';
import { Construct } from 'constructs';

export class BillingStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create billing group for MCP-SERVER project
    const billingGroup = new billingconductor.CfnBillingGroup(this, 'MCPServerBillingGroup', {
      name: 'mcp-server-billing-group',
      accountGrouping: {
        linkedAccountIds: [cdk.Stack.of(this).account],
      },
      computationPreference: {
        pricingPlanArn: `arn:aws:billingconductor::${cdk.Stack.of(this).account}:pricing-plan/AWS`,
      },
      description: 'Billing group for all resources tagged with project:MCP-SERVER',
    });

    // Output the billing group ARN
    new cdk.CfnOutput(this, 'BillingGroupArn', {
      value: billingGroup.attrArn,
      description: 'ARN of the MCP-SERVER billing group',
    });

    // Output reminder to tag resources
    new cdk.CfnOutput(this, 'TaggingInstructions', {
      value: 'Tag your resources with: project=MCP-SERVER',
      description: 'Tag resources with this to track costs in the billing group',
    });
  }
}
