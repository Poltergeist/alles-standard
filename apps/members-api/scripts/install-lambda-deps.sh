#!/bin/bash
set -e

echo "📦 Installing Lambda function dependencies..."

# Install dependencies for each Lambda
for lambda_dir in lambda/*/; do
    if [ -f "${lambda_dir}package.json" ]; then
        echo "Installing dependencies for ${lambda_dir}..."
        (cd "$lambda_dir" && npm install --silent)
    fi
done

echo "✅ All Lambda dependencies installed!"
