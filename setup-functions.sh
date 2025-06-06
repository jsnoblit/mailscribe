#!/bin/bash

echo "Setting up Firebase Functions for MailScribe..."

# Navigate to functions directory
cd functions

echo "Installing dependencies..."
npm install

echo "Building functions..."
npm run build

echo "Setup complete!"
echo ""
echo "Next steps:"
echo "1. Make sure you're logged into Firebase: firebase login"
echo "2. Deploy functions: firebase deploy --only functions"
