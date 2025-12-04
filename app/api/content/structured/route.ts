import { NextRequest, NextResponse } from 'next/server';
import { finalizeEvent, getPublicKey, SimplePool, Event } from 'nostr-tools';
import { hexToBytes } from '@noble/hashes/utils';
import { decode, NostrTypeGuard } from 'nostr-tools/nip19';

// Server-side key management (reused from main route)
let privateKey: Uint8Array | null = null;

function getPrivateKey(): Uint8Array | null {
  if (privateKey) {
    return privateKey;
  }

  const envPrivateKey = process.env.NOSTR_PRIVATE_KEY;
  if (!envPrivateKey) {
    return null;
  }

  try {
    const trimmedKey = envPrivateKey.trim();
    
    // Handle nsec format (bech32 encoded)
    if (NostrTypeGuard.isNSec(trimmedKey)) {
      const decoded = decode(trimmedKey);
      if (decoded.type === 'nsec') {
        privateKey = decoded.data;
        return privateKey;
      }
      throw new Error('Failed to decode nsec format');
    }
    
    // Handle hex format
    let normalizedKey = trimmedKey.toLowerCase();
    
    // Remove '0x' prefix if present
    if (normalizedKey.startsWith('0x')) {
      normalizedKey = normalizedKey.slice(2);
    }
    
    // Validate hex characters (only 0-9, a-f)
    if (!/^[0-9a-f]+$/.test(normalizedKey)) {
      throw new Error('Invalid hex characters detected. Private key must contain only 0-9 and a-f (or A-F)');
    }
    
    // Pad with leading zero if length is 63 (should be 64 for 32 bytes)
    if (normalizedKey.length === 63) {
      normalizedKey = '0' + normalizedKey;
    }
    
    // Validate length (should be 64 hex characters for 32 bytes)
    if (normalizedKey.length !== 64) {
      throw new Error(`Invalid private key length: expected 64 hex characters, got ${normalizedKey.length}. If using nsec format, it should start with 'nsec1'`);
    }
    
    privateKey = hexToBytes(normalizedKey);
    return privateKey;
  } catch (error) {
    console.error('Error parsing NOSTR_PRIVATE_KEY:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }
    return null;
  }
}

function requirePrivateKey(): Uint8Array {
  const key = getPrivateKey();
  if (!key) {
    throw new Error('NOSTR_PRIVATE_KEY_NOT_CONFIGURED');
  }
  return key;
}

const relayUrl = process.env.NOSTR_RELAY_URL || 'wss://relay.damus.io';

// Structured content interface
interface StructuredContentItem {
  id: string;
  name: string;
  content: string;
  createdAt: string;
}

// POST - Create/update structured content
export async function POST(request: NextRequest) {
  try {
    const { name, content } = await request.json();

    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Content name is required' },
        { status: 400 }
      );
    }

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    let privateKeyBytes: Uint8Array;
    try {
      privateKeyBytes = requirePrivateKey();
    } catch (error) {
      return NextResponse.json(
        { 
          error: 'NOSTR_CREDENTIALS_MISSING',
          message: 'Nostr credentials are not configured. Please set NOSTR_PRIVATE_KEY environment variable.'
        },
        { status: 503 }
      );
    }

    const publicKey = getPublicKey(privateKeyBytes);

    // Create structured content event (kind 30000 = replaceable event per NIP-33)
    // Using d tag to identify content type (mission, charter, values, etc.)
    const eventTemplate = {
      kind: 30000,
      created_at: Math.floor(Date.now() / 1000),
      tags: [
        ['d', name], // Identifier tag for this content type
      ],
      content,
    };

    const event = finalizeEvent(eventTemplate, privateKeyBytes);

    // Publish to Nostr relay (server-side)
    const pool = new SimplePool();
    const relays = [relayUrl];

    try {
      // pool.publish returns an array of promises (one per relay)
      const publishPromises = pool.publish(relays, event);
      
      // Wait for all relays to confirm receipt
      const results = await Promise.allSettled(publishPromises);
      
      // Check if at least one relay accepted the event
      const hasSuccess = results.some(
        (result) => result.status === 'fulfilled' && result.value !== null
      );
      
      if (!hasSuccess) {
        console.error('Failed to publish to any relay:', results);
        throw new Error('Failed to publish event to relay');
      }
      
      // Give relay a moment to index the event before closing
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      pool.close(relays);

      // Return generic response
      return NextResponse.json({
        success: true,
        id: event.id,
        name,
        content: event.content,
        createdAt: new Date(event.created_at * 1000).toISOString(),
      });
    } catch (error) {
      pool.close(relays);
      console.error('Error publishing to relay:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error creating structured content:', error);
    
    // Return more specific error message
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Failed to create structured content';
    
    return NextResponse.json(
      { 
        error: 'FAILED_TO_PUBLISH',
        message: errorMessage 
      },
      { status: 500 }
    );
  }
}

// GET - Fetch structured content
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name'); // Optional: filter by name

    let privateKeyBytes: Uint8Array;
    try {
      privateKeyBytes = requirePrivateKey();
    } catch (error) {
      return NextResponse.json(
        { 
          error: 'NOSTR_CREDENTIALS_MISSING',
          message: 'Nostr credentials are not configured. Please set NOSTR_PRIVATE_KEY environment variable.'
        },
        { status: 503 }
      );
    }

    const publicKey = getPublicKey(privateKeyBytes);

    // Fetch from Nostr relay (server-side)
    const pool = new SimplePool();
    const relays = [relayUrl];

    return new Promise<NextResponse>((resolve) => {
      const events: StructuredContentItem[] = [];

      // Build filter
      const filter: any = {
        kinds: [30000], // Structured content kind
        authors: [publicKey],
      };

      // If name specified, filter by d tag
      if (name) {
        filter['#d'] = [name]; // Filter by d tag value
      }

      const sub = pool.subscribeEose(relays, filter, {
        onevent: (event: Event) => {
          // Extract name from d tag
          const dTag = event.tags.find((tag) => tag[0] === 'd');
          const contentName = dTag ? dTag[1] : 'unknown';

          events.push({
            id: event.id,
            name: contentName,
            content: event.content,
            createdAt: new Date(event.created_at * 1000).toISOString(),
          });
        },
        onclose: () => {
          pool.close(relays);

          // Return generic response
          resolve(
            NextResponse.json({
              items: events.sort(
                (a, b) =>
                  new Date(b.createdAt).getTime() -
                  new Date(a.createdAt).getTime()
              ),
            })
          );
        },
        maxWait: 5000,
      });

      // Timeout after 5 seconds
      setTimeout(() => {
        sub.close();
        pool.close(relays);
        resolve(
          NextResponse.json({
            items: events.sort(
              (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
            ),
          })
        );
      }, 5000);
    });
  } catch (error) {
    console.error('Error fetching structured content:', error);
    return NextResponse.json(
      { error: 'Failed to fetch structured content' },
      { status: 500 }
    );
  }
}

