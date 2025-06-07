#!/bin/bash

echo "🧪 Testing Environment Variables Loading..."
echo ""

cd /Users/jnoblit/CursorProjects/mailscribe

# Test with Node.js directly
echo "1. Testing direct environment loading:"
node -e "
console.log('📂 Working directory:', process.cwd());

// Load environment files
require('dotenv').config({ path: './.env' });
require('dotenv').config({ path: './.env.local' });

console.log('🔍 Raw environment check:');
console.log('  NEXT_PUBLIC_FIREBASE_API_KEY:', process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? 'Found' : 'Missing');
console.log('  NEXT_PUBLIC_FIREBASE_PROJECT_ID:', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? 'Found' : 'Missing');

if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
    console.log('  API Key preview:', process.env.NEXT_PUBLIC_FIREBASE_API_KEY.substring(0, 15) + '...');
}
"

echo ""
echo "2. Clearing Next.js cache and restarting..."

# Kill any running dev server
pkill -f "next dev" 2>/dev/null || true
sleep 2

# Remove cache
rm -rf .next

echo "✅ Cache cleared"
echo ""
echo "3. 🚀 Now run: npm run dev"
echo ""
echo "4. The Firebase config should now work with fallback values"
echo "   Check the browser console for Firebase initialization logs"
echo ""
echo "5. Visit: http://localhost:9002"
echo "   You should see Firebase config logs in the browser console"
echo ""
