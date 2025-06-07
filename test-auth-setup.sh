#!/bin/bash

echo "🔍 Testing MailScribe Authentication Setup..."
echo ""

# Check if Firebase config exists
echo "📋 Checking Firebase configuration..."
if [ -f ".env.local" ]; then
    echo "✅ .env.local file found"
    
    # Check for required Firebase env vars
    if grep -q "NEXT_PUBLIC_FIREBASE_API_KEY" .env.local; then
        echo "✅ Firebase API key configured"
    else
        echo "❌ Firebase API key missing"
    fi
    
    if grep -q "NEXT_PUBLIC_GOOGLE_CLIENT_ID" .env.local; then
        echo "✅ Google Client ID configured"
    else
        echo "❌ Google Client ID missing"
    fi
else
    echo "❌ .env.local file not found"
fi

echo ""

# Check if node_modules exists
echo "📦 Checking dependencies..."
if [ -d "node_modules" ]; then
    echo "✅ Dependencies installed"
else
    echo "❌ Dependencies not installed. Run: npm install"
fi

echo ""

# Check if Firebase functions are deployed
echo "🔧 Checking Firebase functions..."
if [ -d "functions" ]; then
    echo "✅ Functions directory exists"
    
    if [ -f "functions/package.json" ]; then
        echo "✅ Functions package.json exists"
    else
        echo "❌ Functions package.json missing"
    fi
else
    echo "❌ Functions directory missing"
fi

echo ""

# Test Firebase function availability
echo "🌐 Testing Firebase function endpoint..."
curl -s -o /dev/null -w "%{http_code}" "https://us-central1-mailscribe-ae722.cloudfunctions.net/testFunction" | {
    read response
    if [ "$response" = "200" ]; then
        echo "✅ Firebase functions are accessible"
    else
        echo "❌ Firebase functions not accessible (HTTP $response)"
        echo "   Make sure functions are deployed: npm run build && firebase deploy --only functions"
    fi
}

echo ""

# Check Next.js configuration
echo "⚛️  Checking Next.js setup..."
if [ -f "next.config.ts" ]; then
    echo "✅ Next.js config found"
else
    echo "❌ Next.js config missing"
fi

if [ -f "tailwind.config.ts" ]; then
    echo "✅ Tailwind config found"
else
    echo "❌ Tailwind config missing"
fi

echo ""
echo "🚀 To start the development server:"
echo "   npm run dev"
echo ""
echo "🔐 Authentication flow:"
echo "   1. User clicks 'Sign in with Google'"
echo "   2. Firebase Auth handles OAuth popup"
echo "   3. User grants Gmail read permissions"
echo "   4. App receives access token"
echo "   5. Token is used for Gmail API calls"
echo ""
