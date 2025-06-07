#!/bin/bash

echo "🚀 MailScribe Quick Start - Working Directory Fix"
echo ""

# Navigate to the correct directory
echo "📂 Navigating to the correct directory..."
cd /Users/jnoblit/CursorProjects/mailscribe

# Verify we're in the right place
if [ -f "package.json" ] && [ -d "src" ]; then
    echo "✅ Confirmed: We're in the MailScribe project directory"
    echo "📍 Current location: $(pwd)"
else
    echo "❌ Error: Not in the correct MailScribe directory"
    echo "📍 Current location: $(pwd)"
    echo "🔧 Please manually navigate to: /Users/jnoblit/CursorProjects/mailscribe"
    exit 1
fi

echo ""
echo "🔧 Cleaning up and preparing environment..."

# Kill any running processes
pkill -f "next dev" 2>/dev/null || true

# Clean Next.js cache
rm -rf .next 2>/dev/null || true

# Verify environment files exist
echo "📄 Checking environment files:"
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
echo "🧪 Testing environment loading..."
node -e "
    require('dotenv').config({ path: '.env' });
    require('dotenv').config({ path: '.env.local' });
    
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    
    console.log('Environment test results:');
    console.log('  Firebase API Key:', apiKey ? '✅ Loaded (' + apiKey.substring(0, 10) + '...)' : '❌ Missing');
    console.log('  Firebase Project ID:', projectId ? '✅ Loaded (' + projectId + ')' : '❌ Missing');
    
    if (!apiKey || !projectId) {
        console.log('');
        console.log('❌ Environment variables not loading properly!');
        console.log('🔧 Check that .env and .env.local files contain the correct values');
    } else {
        console.log('');
        console.log('✅ Environment variables loading correctly!');
    }
" 2>/dev/null

echo ""
echo "🚀 Starting development server..."
echo "📍 Make sure to run from this directory: $(pwd)"
echo ""
echo "Run this command:"
echo "   npm run dev"
echo ""
echo "Then visit: http://localhost:9002"
echo ""
