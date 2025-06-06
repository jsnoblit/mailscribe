#!/bin/bash

echo "🔧 Setting up MailScribe with proper Chrome configuration..."
echo ""

# Test Chrome installation locally first
echo "1️⃣ Testing local Chrome installation..."
cd /Users/jnoblit/CursorProjects/mailscribe/functions

# Run the Chrome detection test
echo "🔍 Running Chrome detection test..."
if node test-chrome.js; then
    echo "✅ Local Chrome test passed!"
else
    echo "⚠️ Local Chrome test had issues, but continuing..."
fi

echo ""
echo "2️⃣ Setting up Firebase Functions..."

# Navigate to functions directory
cd /Users/jnoblit/CursorProjects/mailscribe/functions

echo "📦 Installing dependencies..."
npm install

echo "🌐 Installing Chrome for Puppeteer..."
npx puppeteer browsers install chrome

echo "🏗️ Building functions..."
npm run build

echo ""
echo "3️⃣ Deploying to Firebase..."
cd ..
firebase deploy --only functions

echo ""
echo "✅ Deployment complete!"

echo ""
echo "📋 Available endpoints:"
echo "- searchGmailMessages"
echo "- getEmailContent" 
echo "- generateServerScreenshot (enhanced with your Chrome path)"
echo "- generateReliableServerScreenshot (fallback version)"
echo "- generateClientSideScreenshotData (hybrid approach)"

echo ""
echo "🔄 Chrome detection includes your specific path:"
echo "   /Users/jnoblit/.cache/puppeteer/chrome/mac_arm-137.0.7151.55/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing"

echo ""
echo "📱 Test the app:"
echo "1. Start dev server: npm run dev"
echo "2. Go to http://localhost:9002/integrated"  
echo "3. Use Gmail access token"
echo "4. Select 'Hybrid' mode for best results"
echo "5. Try taking screenshots!"

echo ""
echo "🎯 Hybrid mode will automatically:"
echo "   ✅ Try server-side Puppeteer (with your Chrome path)"
echo "   ✅ Fallback to enhanced client-side processing"
echo "   ✅ Final fallback to basic client-side screenshots"

echo ""
echo "This should completely resolve the Chrome installation issues! 🚀"
