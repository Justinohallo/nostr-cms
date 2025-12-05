import { NextRequest, NextResponse } from 'next/server';
import { generateConnectionToken, generateNostrConnectURI } from '@/lib/auth/nip46';

const relayUrl = process.env.NOSTR_RELAY_URL || 'wss://relay.damus.io';

/**
 * GET /api/auth/connect
 * Generates a connection token and returns the Nostr Connect URI
 */
export async function GET(request: NextRequest) {
  try {
    const { secret, publicKey } = generateConnectionToken();
    const uri = generateNostrConnectURI(publicKey, relayUrl, 'Nostr CMS');

    // In a real implementation, you'd store the secret temporarily
    // and associate it with the connection request
    // For now, we'll return it (in production, use a secure session store)

    return NextResponse.json({
      uri,
      appPublicKey: publicKey,
      // Note: In production, don't return the secret to the client
      // Store it server-side and associate with the connection
    });
  } catch (error) {
    console.error('Connection error:', error);
    return NextResponse.json(
      { error: 'Failed to generate connection' },
      { status: 500 }
    );
  }
}

