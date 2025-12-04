import { getPublicKey, SimplePool, Event } from 'nostr-tools';
import { hexToBytes } from '@noble/hashes/utils';
import { decode, NostrTypeGuard } from 'nostr-tools/nip19';

// Server-side key management
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

export interface StructuredContentItem {
  id: string;
  name: string;
  content: string;
  createdAt: string;
}

const relayUrl = process.env.NOSTR_RELAY_URL || 'wss://relay.damus.io';

/**
 * Server-side service to fetch structured content from Nostr
 * @returns Array of structured content items
 */
export async function getStructuredContent(): Promise<StructuredContentItem[]> {
  const privateKeyBytes = getPrivateKey();
  if (!privateKeyBytes) {
    console.error('NOSTR_PRIVATE_KEY not configured');
    return [];
  }

  const publicKey = getPublicKey(privateKeyBytes);
  const pool = new SimplePool();
  const relays = [relayUrl];

  return new Promise<StructuredContentItem[]>((resolve) => {
    const events: StructuredContentItem[] = [];

    // Build filter for structured content (kind 30000)
    const filter = {
      kinds: [30000],
      authors: [publicKey],
    };

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
        resolve(
          events.sort(
            (a, b) =>
              new Date(b.createdAt).getTime() -
              new Date(a.createdAt).getTime()
          )
        );
      },
      maxWait: 5000,
    });

    // Timeout after 5 seconds
    setTimeout(() => {
      sub.close();
      pool.close(relays);
      resolve(
        events.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() -
            new Date(a.createdAt).getTime()
        )
      );
    }, 5000);
  });
}

