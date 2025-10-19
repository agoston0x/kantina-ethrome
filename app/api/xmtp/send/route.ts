import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = 'http://localhost:3001';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('API route received:', body);

    const response = await fetch(`${BACKEND_URL}/api/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    console.log('Backend response status:', response.status);
    const data = await response.json();
    console.log('Backend response data:', data);

    if (!response.ok) {
      console.error('Backend error:', data);
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send message' },
      { status: 500 }
    );
  }
}
