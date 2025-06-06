#!/bin/bash

echo "🔍 Checking Firebase Functions deployment status..."

echo ""
echo "1️⃣ Listing deployed functions..."
firebase functions:list

echo ""
echo "2️⃣ Checking recent logs..."
firebase functions:log --limit 10

echo ""
echo "3️⃣ Testing functions directly..."
node test-firebase-functions.js

echo ""
echo "4️⃣ Function URLs should be:"
echo "   https://us-central1-mailscribe-ae722.cloudfunctions.net/testFunction"
echo "   https://us-central1-mailscribe-ae722.cloudfunctions.net/searchGmailMessages"
echo "   https://us-central1-mailscribe-ae722.cloudfunctions.net/generateServerScreenshot"
echo "   https://us-central1-mailscribe-ae722.cloudfunctions.net/generateReliableServerScreenshot"
echo "   https://us-central1-mailscribe-ae722.cloudfunctions.net/generateClientSideScreenshotData"

echo ""
echo "If some functions are missing, redeploy with:"
echo "   firebase deploy --only functions"
