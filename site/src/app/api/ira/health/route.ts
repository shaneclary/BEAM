import { NextResponse } from 'next/server';
import ira from '@/lib/ira';

export async function GET() {
  if (!ira.isConfigured()) {
    return NextResponse.json(
      { status: 'error', message: 'Ira not configured' },
      { status: 503 }
    );
  }

  const modelInfo = ira.getModelInfo();
  const health = await ira.healthCheck();

  return NextResponse.json({
    ...health,
    config: {
      isFineTuned: modelInfo.isFineTuned,
      fallbackEnabled: modelInfo.fallbackEnabled,
    },
  });
}
