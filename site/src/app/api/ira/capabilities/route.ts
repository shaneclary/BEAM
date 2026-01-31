import { NextResponse } from 'next/server';
import ira from '@/lib/ira';

export async function GET() {
  return NextResponse.json({
    name: 'Ira',
    version: '1.0.0',
    status: ira.isConfigured() ? 'ready' : 'not_configured',
    capabilities: ira.getCapabilities(),
    boundaries: {
      allowedTopics: ira.boundaries.topics.allowed,
      restrictedTopics: ira.boundaries.topics.restricted,
    },
    safety: {
      contentModeration: ira.safety.contentModeration.enabled,
      piiProtection: ira.safety.piiProtection.enabled,
      rateLimit: ira.safety.rateLimit,
    },
    disclaimers: ira.disclaimers,
  });
}
