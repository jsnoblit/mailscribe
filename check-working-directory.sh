#!/bin/bash

echo "🔍 Checking Working Directory and Environment Setup..."
echo ""

echo "📂 Current working directory should be:"
echo "   /Users/jnoblit/CursorProjects/mailscribe"
echo ""

echo "📂 Your actual current directory:"
pwd
echo ""

echo "🔍 Checking if we're in the right place..."
if [ -f "package.json" ]; then
    echo "✅ package.json found"
    PROJECT_NAME=$(grep '"name"' package.json | cut -d'"' -f4)
    echo "📦 Project name in package.json: $PROJECT_NAME"
else
    echo "❌ package.json NOT found - you're in the wrong directory!"
    echo ""
    echo "🔧 To fix this:"
    echo "   cd /Users/jnoblit/CursorProjects/mailscribe"
    echo "   npm run dev"
    exit 1
fi

echo ""
echo "🔍 Checking for environment files in current directory..."
if [ -f ".env" ]; then
    echo "✅ .env file found in current directory"
else
    echo "❌ .env file NOT found in current directory"
fi

if [ -f ".env.local" ]; then
    echo "✅ .env.local file found in current directory"
else
    echo "❌ .env.local file NOT found in current directory"
fi

echo ""
echo "🔍 Checking for Next.js files..."
if [ -f "next.config.ts" ]; then
    echo "✅ next.config.ts found"
else
    echo "❌ next.config.ts NOT found"
fi

if [ -d "src" ]; then
    echo "✅ src directory found"
else
    echo "❌ src directory NOT found"
fi

if [ -d ".next" ]; then
    echo "✅ .next directory found (build cache exists)"
else
    echo "ℹ️  .next directory not found (no build cache)"
fi

echo ""
echo "🧪 Testing environment variable loading from current directory..."
if command -v node &> /dev/null; then
    node -e "
        console.log('🔍 Testing from directory:', process.cwd());
        
        // Try loading .env files from current directory
        require('dotenv').config({ path: './.env' });
        require('dotenv').config({ path: './.env.local' });
        
        const hasFirebaseApiKey = !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
        const hasFirebaseProjectId = !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
        
        console.log('📊 Environment loading test:');
        console.log('  API Key loaded:', hasFirebaseApiKey ? '✅' : '❌');
        console.log('  Project ID loaded:', hasFirebaseProjectId ? '✅' : '❌');
        
        if (hasFirebaseApiKey) {
            console.log('  API Key preview:', process.env.NEXT_PUBLIC_FIREBASE_API_KEY.substring(0, 10) + '...');
        }
        
        if (!hasFirebaseApiKey || !hasFirebaseProjectId) {
            console.log('');
            console.log('❌ Environment variables not loading from current directory!');
            console.log('🔧 Make sure you are running from: /Users/jnoblit/CursorProjects/mailscribe');
        }
    " 2>/dev/null || echo "❌ Could not test with Node.js"
fi

echo ""
echo "🚀 If everything looks correct above, try:"
echo "   1. Kill any running dev server (Ctrl+C)"
echo "   2. rm -rf .next"
echo "   3. npm run dev"
echo ""
echo "🔧 If environment variables still don't load:"
echo "   1. Make sure you're in: /Users/jnoblit/CursorProjects/mailscribe"
echo "   2. Check that .env and .env.local exist in this directory"
echo "   3. Restart your terminal and try again"
echo ""
