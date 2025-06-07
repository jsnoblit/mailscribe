#!/bin/bash

echo "🔍 Diagnosing Firebase Environment Variables..."
echo ""

# Check if .env.local exists
if [ -f ".env.local" ]; then
    echo "✅ .env.local file found"
    echo "📄 File size: $(wc -c < .env.local) bytes"
    echo "📝 Line count: $(wc -l < .env.local) lines"
    echo ""
    
    # Check for Firebase variables
    echo "🔍 Checking Firebase environment variables:"
    
    if grep -q "^NEXT_PUBLIC_FIREBASE_API_KEY=" .env.local; then
        API_KEY=$(grep "^NEXT_PUBLIC_FIREBASE_API_KEY=" .env.local | cut -d'=' -f2)
        echo "✅ NEXT_PUBLIC_FIREBASE_API_KEY: ${API_KEY:0:10}..."
    else
        echo "❌ NEXT_PUBLIC_FIREBASE_API_KEY: Missing or commented out"
    fi
    
    if grep -q "^NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=" .env.local; then
        AUTH_DOMAIN=$(grep "^NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=" .env.local | cut -d'=' -f2)
        echo "✅ NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: $AUTH_DOMAIN"
    else
        echo "❌ NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: Missing or commented out"
    fi
    
    if grep -q "^NEXT_PUBLIC_FIREBASE_PROJECT_ID=" .env.local; then
        PROJECT_ID=$(grep "^NEXT_PUBLIC_FIREBASE_PROJECT_ID=" .env.local | cut -d'=' -f2)
        echo "✅ NEXT_PUBLIC_FIREBASE_PROJECT_ID: $PROJECT_ID"
    else
        echo "❌ NEXT_PUBLIC_FIREBASE_PROJECT_ID: Missing or commented out"
    fi
    
    if grep -q "^NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=" .env.local; then
        STORAGE_BUCKET=$(grep "^NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=" .env.local | cut -d'=' -f2)
        echo "✅ NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: $STORAGE_BUCKET"
    else
        echo "❌ NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: Missing or commented out"
    fi
    
    if grep -q "^NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=" .env.local; then
        SENDER_ID=$(grep "^NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=" .env.local | cut -d'=' -f2)
        echo "✅ NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: $SENDER_ID"
    else
        echo "❌ NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: Missing or commented out"
    fi
    
    if grep -q "^NEXT_PUBLIC_FIREBASE_APP_ID=" .env.local; then
        APP_ID=$(grep "^NEXT_PUBLIC_FIREBASE_APP_ID=" .env.local | cut -d'=' -f2)
        echo "✅ NEXT_PUBLIC_FIREBASE_APP_ID: ${APP_ID:0:20}..."
    else
        echo "❌ NEXT_PUBLIC_FIREBASE_APP_ID: Missing or commented out"
    fi
    
else
    echo "❌ .env.local file not found"
fi

echo ""
echo "🔧 Quick Fixes:"
echo ""
echo "1. Stop your development server (Ctrl+C)"
echo "2. Make sure .env.local is in the root directory"
echo "3. Check for typos in variable names"
echo "4. Restart development server: npm run dev"
echo ""

# Test if Next.js can access the variables
echo "🧪 Testing Next.js environment loading..."
if command -v node &> /dev/null; then
    node -e "
        require('dotenv').config({ path: '.env.local' });
        console.log('API Key loaded:', !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY);
        console.log('All vars:', Object.keys(process.env).filter(k => k.startsWith('NEXT_PUBLIC_FIREBASE')));
    " 2>/dev/null || echo "⚠️  Could not test with Node.js"
fi

echo ""
echo "📍 Current directory: $(pwd)"
echo "📂 Make sure you're running this from your project root!"
