#!/bin/bash
set -e

echo "🚀 Starting local development environment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Start LocalStack
echo "📦 Starting LocalStack..."
docker-compose up -d

# Wait for LocalStack to be ready
echo "⏳ Waiting for LocalStack to initialize..."
timeout 60 bash -c 'until docker exec alles-standard-localstack awslocal dynamodb list-tables > /dev/null 2>&1; do sleep 2; done' || {
    echo "❌ LocalStack failed to start"
    exit 1
}

echo "✅ LocalStack is ready!"
echo ""
echo "📊 DynamoDB Tables:"
docker exec alles-standard-localstack awslocal dynamodb list-tables

echo ""
echo "🔐 SSM Parameters:"
docker exec alles-standard-localstack awslocal ssm describe-parameters --query 'Parameters[*].Name' --output text

echo ""
echo "🎯 LocalStack Dashboard: http://localhost:4566/_localstack/health"
echo ""
echo "Next steps:"
echo "  1. Install Lambda dependencies: npm run install-lambda-deps"
echo "  2. Start SAM Local API: npm run start-api"
echo "  3. Start Astro frontend: cd ../web && npm run dev"
