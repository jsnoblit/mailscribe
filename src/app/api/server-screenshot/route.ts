import { NextRequest, NextResponse } from 'next/server';

const FIREBASE_FUNCTIONS_URL = 'https://us-central1-mailscribe-ae722.cloudfunctions.net';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { accessToken, messageId, brand } = body;

    if (!accessToken || !messageId) {
      return NextResponse.json(
        { error: 'Access token and message ID are required' },
        { status: 400 }
      );
    }

    console.log('Calling server screenshot function for:', messageId);

    const response = await fetch(`${FIREBASE_FUNCTIONS_URL}/generateReliableServerScreenshot`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        accessToken,
        messageId,
        brand: brand || 'unknown',
      }),
    });

    console.log('Server screenshot response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Server screenshot error:', errorText);
      throw new Error(`Server screenshot failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Server screenshot success, data keys:', Object.keys(data));
    console.log('Has htmlContent:', !!data.htmlContent);
    console.log('Has filename:', !!data.filename);
    console.log('Success flag:', data.success);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in server screenshot API route:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate server screenshot',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
