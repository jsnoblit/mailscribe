import { NextRequest, NextResponse } from 'next/server';

const FIREBASE_FUNCTIONS_URL = 'https://us-central1-mailscribe-ae722.cloudfunctions.net';

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(`${FIREBASE_FUNCTIONS_URL}/testFunction`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      throw new Error(`Firebase function error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json({
      status: 'success',
      firebase_response: data,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error calling Firebase function:', error);
    return NextResponse.json(
      { 
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
