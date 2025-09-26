#!/bin/bash

# Script to help extract service account key for Vercel environment variables
# Run this script to get the JSON content for GOOGLE_APPLICATION_CREDENTIALS_JSON

echo "🔑 Google Cloud Storage Service Account Key Extractor"
echo "=================================================="
echo ""

# Check if key file exists
if [ ! -f "bteb-672bd-08e90aa5fe7c.json" ]; then
    echo "❌ Error: Service account key file not found!"
    echo "   Please ensure 'bteb-672bd-08e90aa5fe7c.json' is in the project root."
    echo ""
    echo "📋 Steps to get the key file:"
    echo "   1. Go to Google Cloud Console"
    echo "   2. Navigate to IAM & Admin > Service Accounts"
    echo "   3. Find your service account"
    echo "   4. Click 'Keys' tab"
    echo "   5. Click 'Add Key' > 'Create new key'"
    echo "   6. Choose 'JSON' format"
    echo "   7. Download and rename to 'bteb-672bd-08e90aa5fe7c.json'"
    exit 1
fi

echo "✅ Service account key file found!"
echo ""

# Extract and display the JSON content
echo "📋 Copy the following JSON content for Vercel environment variable:"
echo "   Variable Name: GOOGLE_APPLICATION_CREDENTIALS_JSON"
echo "   Environment: Production, Preview, Development"
echo ""
echo "--- START COPYING FROM HERE ---"
cat bteb-672bd-08e90aa5fe7c.json
echo ""
echo "--- STOP COPYING HERE ---"
echo ""

echo "🚀 Next Steps:"
echo "   1. Go to Vercel Dashboard"
echo "   2. Navigate to your project settings"
echo "   3. Go to Environment Variables"
echo "   4. Add new variable:"
echo "      - Name: GOOGLE_APPLICATION_CREDENTIALS_JSON"
echo "      - Value: [paste the JSON content above]"
echo "      - Environment: Production, Preview, Development"
echo "   5. Redeploy your application"
echo ""

echo "🔒 Security Note:"
echo "   - Never commit the key file to version control"
echo "   - The key file is already in .gitignore"
echo "   - Environment variables are encrypted in Vercel"
echo ""

echo "✅ Setup complete! Your GCS integration will work in Vercel."
