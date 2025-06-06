// Test script to check Firebase Functions directly
async function testFirebaseFunctions() {
  const FIREBASE_FUNCTIONS_URL = 'https://us-central1-mailscribe-ae722.cloudfunctions.net';
  
  console.log('🔍 Testing Firebase Functions...');
  
  // Test 1: Check if testFunction is working
  try {
    console.log('1️⃣ Testing testFunction...');
    const response = await fetch(`${FIREBASE_FUNCTIONS_URL}/testFunction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ testFunction works:', data);
    } else {
      console.log('❌ testFunction failed:', response.status, await response.text());
    }
  } catch (error) {
    console.log('❌ testFunction error:', error.message);
  }
  
  // Test 2: Check if generateReliableServerScreenshot exists
  try {
    console.log('2️⃣ Testing generateReliableServerScreenshot...');
    const response = await fetch(`${FIREBASE_FUNCTIONS_URL}/generateReliableServerScreenshot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accessToken: 'fake-token',
        messageId: 'fake-id',
        brand: 'test'
      }),
    });
    
    console.log('Response status:', response.status);
    const responseText = await response.text();
    console.log('Response body:', responseText);
    
    if (response.status === 400 && responseText.includes('Access token')) {
      console.log('✅ generateReliableServerScreenshot exists (validation working)');
    } else {
      console.log('⚠️ Unexpected response from generateReliableServerScreenshot');
    }
  } catch (error) {
    console.log('❌ generateReliableServerScreenshot error:', error.message);
  }
  
  // Test 3: Check if generateClientSideScreenshotData exists
  try {
    console.log('3️⃣ Testing generateClientSideScreenshotData...');
    const response = await fetch(`${FIREBASE_FUNCTIONS_URL}/generateClientSideScreenshotData`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accessToken: 'fake-token',
        messageIds: ['fake-id'],
        brand: 'test'
      }),
    });
    
    console.log('Response status:', response.status);
    const responseText = await response.text();
    console.log('Response body:', responseText);
    
    if (response.status === 400 && responseText.includes('Access token')) {
      console.log('✅ generateClientSideScreenshotData exists (validation working)');
    } else {
      console.log('⚠️ Unexpected response from generateClientSideScreenshotData');
    }
  } catch (error) {
    console.log('❌ generateClientSideScreenshotData error:', error.message);
  }
}

// Run the test
testFirebaseFunctions().then(() => {
  console.log('🏁 Firebase Functions test complete!');
}).catch(console.error);
