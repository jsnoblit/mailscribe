#!/bin/bash

echo "🔧 Fixing Firebase Environment Variables..."
echo ""

# Stop any running development server
echo "1. Stopping any running processes..."
pkill -f "next dev" 2>/dev/null || true

# Backup current .env.local
if [ -f ".env.local" ]; then
    echo "2. Backing up current .env.local to .env.local.backup"
    cp .env.local .env.local.backup
fi

# Use the clean version
echo "3. Using clean environment configuration..."
cp .env.local.clean .env.local

# Verify the fix
echo "4. Verifying Firebase variables are now accessible..."
echo ""

if grep -q "^NEXT_PUBLIC_FIREBASE_API_KEY=" .env.local; then
    echo "✅ NEXT_PUBLIC_FIREBASE_API_KEY found"
else
    echo "❌ NEXT_PUBLIC_FIREBASE_API_KEY still missing"
fi

if grep -q "^NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=" .env.local; then
    echo "✅ NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN found"
else
    echo "❌ NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN still missing"
fi

if grep -q "^NEXT_PUBLIC_FIREBASE_PROJECT_ID=" .env.local; then
    echo "✅ NEXT_PUBLIC_FIREBASE_PROJECT_ID found"
else
    echo "❌ NEXT_PUBLIC_FIREBASE_PROJECT_ID still missing"
fi

echo ""
echo "🚀 Now restart your development server:"
echo "   npm run dev"
echo ""
echo "📍 If you still get errors, check the browser console at:"
echo "   http://localhost:9002/env-debug"
echo ""
