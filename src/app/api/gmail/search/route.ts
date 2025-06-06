import { NextRequest, NextResponse } from 'next/server';

const FIREBASE_FUNCTIONS_URL = 'https://us-central1-mailscribe-ae722.cloudfunctions.net';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { accessToken, query, maxResults = 10 } = body;

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Access token is required' },
        { status: 400 }
      );
    }

    console.log('Calling Firebase function with:', {
      hasAccessToken: !!accessToken,
      tokenLength: accessToken.length,
      query,
      maxResults,
    });

    const response = await fetch(`${FIREBASE_FUNCTIONS_URL}/searchGmailMessages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        accessToken,
        query: query || 'in:inbox',
        maxResults,
      }),
    });

    console.log('Firebase function response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Firebase function error:', errorText);
      throw new Error(`Firebase function error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Firebase function success:', data);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in Gmail search API route:', error);
    return NextResponse.json(
      { 
        error: 'Failed to search Gmail messages',
        details: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
