import { NextRequest, NextResponse } from 'next/server';

const FIREBASE_FUNCTIONS_URL = 'https://us-central1-mailscribe-ae722.cloudfunctions.net';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { accessToken, messageIds, brand } = body;

    if (!accessToken || !messageIds || !Array.isArray(messageIds)) {
      return NextResponse.json(
        { error: 'Access token and message IDs array are required' },
        { status: 400 }
      );
    }

    console.log('Calling hybrid screenshot function for:', messageIds.length, 'emails');

    // Use the generateClientSideScreenshotData function which returns HTML for client processing
    const response = await fetch(`${FIREBASE_FUNCTIONS_URL}/generateClientSideScreenshotData`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        accessToken,
        messageIds: messageIds.slice(0, 10), // Limit to 10 for performance
        brand: brand || 'unknown',
      }),
    });

    console.log('Hybrid screenshot response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Hybrid screenshot error:', errorText);
      throw new Error(`Hybrid screenshot failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Hybrid screenshot success - returned', data.emails?.length || 0, 'emails');
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in hybrid screenshot API route:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate hybrid screenshots',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
