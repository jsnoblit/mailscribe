import { NextRequest, NextResponse } from 'next/server';

const FIREBASE_FUNCTIONS_URL = 'https://us-central1-mailscribe-ae722.cloudfunctions.net';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { accessToken, messageId } = body;

    if (!accessToken || !messageId) {
      return NextResponse.json(
        { error: 'Access token and message ID are required' },
        { status: 400 }
      );
    }

    const response = await fetch(`${FIREBASE_FUNCTIONS_URL}/getEmailContent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        accessToken,
        messageId,
      }),
    });

    if (!response.ok) {
      throw new Error(`Firebase function error: ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error getting email content:', error);
    return NextResponse.json(
      { error: 'Failed to get email content' },
      { status: 500 }
    );
  }
}
