#!/bin/bash

echo "🔧 Setting up Firebase Functions with Puppeteer..."

# Navigate to functions directory
cd /Users/jnoblit/CursorProjects/mailscribe/functions

echo "📦 Installing dependencies..."
npm install

echo "🌐 Installing Chrome for Puppeteer..."
npx puppeteer browsers install chrome

echo "🏗️ Building functions..."
npm run build

echo "🚀 Deploying to Firebase..."
cd ..
firebase deploy --only functions

echo "✅ Deployment complete!"

echo ""
echo "📋 Available endpoints:"
echo "- searchGmailMessages"
echo "- getEmailContent" 
echo "- generateServerScreenshot (original with Chrome fixes)"
echo "- generateReliableServerScreenshot (new fallback version)"
echo "- generateClientSideScreenshotData (hybrid approach)"
echo ""
echo "🔄 The hybrid approach will automatically try:"
echo "1. Server-side Puppeteer screenshots"
echo "2. Enhanced client-side with server-processed HTML"
echo "3. Basic client-side screenshots"
echo ""
echo "This should resolve the Chrome installation issues!"
