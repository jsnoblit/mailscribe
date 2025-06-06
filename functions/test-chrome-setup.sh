#!/bin/bash

echo "🚀 Quick Chrome + Puppeteer Test"
echo "================================="

# Navigate to the functions directory
cd /Users/jnoblit/CursorProjects/mailscribe/functions

# Test 1: Check if Chrome exists at your specific path
CHROME_PATH="/Users/jnoblit/.cache/puppeteer/chrome/mac_arm-137.0.7151.55/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing"

echo "1️⃣ Testing Chrome executable..."
if [ -f "$CHROME_PATH" ]; then
    echo "✅ Chrome found at: $CHROME_PATH"
    echo "   File size: $(ls -lh "$CHROME_PATH" | awk '{print $5}')"
    echo "   Permissions: $(ls -l "$CHROME_PATH" | awk '{print $1}')"
else
    echo "❌ Chrome NOT found at expected path"
    echo "   Expected: $CHROME_PATH"
    
    # Check what's actually in the cache
    echo "🔍 Checking Puppeteer cache..."
    CACHE_DIR="/Users/jnoblit/.cache/puppeteer/chrome"
    if [ -d "$CACHE_DIR" ]; then
        echo "   Available versions:"
        ls -la "$CACHE_DIR"
    else
        echo "   ❌ Puppeteer cache directory not found"
    fi
fi

echo ""
echo "2️⃣ Testing Node.js Chrome detection..."
if node test-chrome.js; then
    echo "✅ Chrome detection test passed!"
else
    echo "⚠️ Chrome detection test had issues"
fi

echo ""
echo "3️⃣ Testing Puppeteer installation..."
if npx puppeteer --version; then
    echo "✅ Puppeteer is installed"
else
    echo "❌ Puppeteer installation issue"
fi

echo ""
echo "4️⃣ Environment check..."
echo "PUPPETEER_EXECUTABLE_PATH: $PUPPETEER_EXECUTABLE_PATH"
echo "NODE_VERSION: $(node --version)"
echo "NPM_VERSION: $(npm --version)"

echo ""
echo "🎯 Next steps:"
echo "   If all tests pass → Run: ./deploy-with-chrome-fix.sh"
echo "   If Chrome path issues → Check Puppeteer installation"
echo "   If other issues → Check the specific error messages above"
