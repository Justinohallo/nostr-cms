import { NextRequest, NextResponse } from 'next/server';
import { setSession } from '@/lib/auth/session';
import { verifyEvent } from 'nostr-tools';

/**
 * POST /api/auth/login
 * Handles Nostr Connect login
 * Expects a signed auth event from the user's Nostr app
 */
export async function POST(request: NextRequest) {
  try {
    const { event } = await request.json();

    if (!event) {
      return NextResponse.json(
        { error: 'Event is required' },
        { status: 400 }
      );
    }

    // Verify the event signature
    if (!verifyEvent(event)) {
      return NextResponse.json(
        { error: 'Invalid event signature' },
        { status: 401 }
      );
    }

    // Verify it's an auth event (kind 22242 per NIP-46)
    if (event.kind !== 22242) {
      return NextResponse.json(
        { error: 'Invalid event kind. Expected auth event (22242)' },
        { status: 400 }
      );
    }

    // Extract public key from event
    const publicKey = event.pubkey;

    // Set session
    await setSession(publicKey);

    return NextResponse.json({
      success: true,
      publicKey,
    });
  } catch (error) {
    console.error('Login error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to login';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

