import { NextRequest, NextResponse } from 'next/server';
import ira from '@/lib/ira';

export async function POST(request: NextRequest) {
  try {
    // Check if Ira is configured
    if (!ira.isConfigured()) {
      return NextResponse.json(
        { error: 'Ira is not configured. Please set HUGGINGFACE_API_KEY.' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { messages, context } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    const response = await ira.chat(messages, context);

    return NextResponse.json({
      success: true,
      response: response.message,
      sources: response.sources,
    });
  } catch (error) {
    console.error('Ira API error:', error);
    return NextResponse.json(
      { error: 'Failed to get response from Ira' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    name: 'Ira',
    description: 'BEAM AI Assistant',
    status: ira.isConfigured() ? 'ready' : 'not_configured',
    version: '1.0.0',
  });
}
