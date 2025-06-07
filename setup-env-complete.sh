#!/bin/bash

echo "🔧 Comprehensive Environment Variables Setup..."
echo ""

# Kill any running Next.js processes
echo "1. Stopping any running development servers..."
pkill -f "next dev" 2>/dev/null || true
sleep 2

echo "2. Checking current environment files..."
if [ -f ".env" ]; then
    echo "✅ .env file exists"
else
    echo "❌ .env file missing"
fi

if [ -f ".env.local" ]; then
    echo "✅ .env.local file exists"
else
    echo "❌ .env.local file missing"
fi

echo ""
echo "3. Verifying Firebase variables in both files..."

# Check .env file
if [ -f ".env" ]; then
    echo "📄 Checking .env file:"
    if grep -q "^NEXT_PUBLIC_FIREBASE_API_KEY=" .env; then
        echo "  ✅ API_KEY found in .env"
    else
        echo "  ❌ API_KEY missing in .env"
    fi
    
    if grep -q "^NEXT_PUBLIC_FIREBASE_PROJECT_ID=" .env; then
        echo "  ✅ PROJECT_ID found in .env"
    else
        echo "  ❌ PROJECT_ID missing in .env"
    fi
fi

# Check .env.local file
if [ -f ".env.local" ]; then
    echo "📄 Checking .env.local file:"
    if grep -q "^NEXT_PUBLIC_FIREBASE_API_KEY=" .env.local; then
        echo "  ✅ API_KEY found in .env.local"
    else
        echo "  ❌ API_KEY missing in .env.local"
    fi
    
    if grep -q "^NEXT_PUBLIC_FIREBASE_PROJECT_ID=" .env.local; then
        echo "  ✅ PROJECT_ID found in .env.local"
    else
        echo "  ❌ PROJECT_ID missing in .env.local"
    fi
fi

echo ""
echo "4. Testing environment loading with Node.js..."

# Test with node directly
if command -v node &> /dev/null; then
    echo "🧪 Testing direct environment loading:"
    node -e "
        // Load both .env and .env.local
        require('dotenv').config({ path: '.env' });
        require('dotenv').config({ path: '.env.local' });
        
        console.log('📊 Environment Test Results:');
        console.log('  API Key:', process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? '✅ Loaded' : '❌ Missing');
        console.log('  Auth Domain:', process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? '✅ Loaded' : '❌ Missing');
        console.log('  Project ID:', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? '✅ Loaded' : '❌ Missing');
        console.log('  Storage Bucket:', process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ? '✅ Loaded' : '❌ Missing');
        console.log('  Messaging Sender ID:', process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ? '✅ Loaded' : '❌ Missing');
        console.log('  App ID:', process.env.NEXT_PUBLIC_FIREBASE_APP_ID ? '✅ Loaded' : '❌ Missing');
        
        // Show first few characters of API key to verify it's the real value
        if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
            console.log('  API Key preview:', process.env.NEXT_PUBLIC_FIREBASE_API_KEY.substring(0, 10) + '...');
        }
    " 2>/dev/null || echo "❌ Could not test with Node.js"
fi

echo ""
echo "5. Cleaning Next.js cache..."
rm -rf .next 2>/dev/null || true

echo ""
echo "✅ Environment setup complete!"
echo ""
echo "🚀 Next steps:"
echo "1. Run: npm run dev"
echo "2. Visit: http://localhost:9002/env-debug"
echo "3. Check browser console for Firebase config logs"
echo ""
echo "🔍 If you still get errors:"
echo "- Check the browser console for detailed error messages"
echo "- Make sure you're in the correct directory: $(pwd)"
echo "- Verify your Firebase project settings in the Firebase Console"
echo ""
