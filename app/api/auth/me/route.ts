import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth/session';

/**
 * GET /api/auth/me
 * Returns the current authenticated user's public key
 */
export async function GET(request: NextRequest) {
  const session = getSessionFromRequest(request);
  
  if (!session) {
    return NextResponse.json(
      { authenticated: false },
      { status: 401 }
    );
  }

  return NextResponse.json({
    authenticated: true,
    publicKey: session.publicKey,
  });
}

