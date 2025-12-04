import { getPublicKey } from 'nostr-tools';
import { randomBytes } from '@noble/hashes/utils';
import { nip19 } from 'nostr-tools';

/**
 * Generate a connection token for NIP-46
 * This creates a temporary keypair that will be used for the connection
 */
export function generateConnectionToken(): { secret: string; publicKey: string } {
  // Generate 32 random bytes for private key
  const secretBytes = randomBytes(32);
  const secret = Array.from(secretBytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  const publicKey = getPublicKey(secretBytes);
  return { secret, publicKey };
}

/**
 * Generate a Nostr Connect URI (nostrconnect://)
 * This is what users scan with their Nostr app
 * Format: nostrconnect://<npub>?relay=<relay>&metadata=<json>
 * The public key should be in npub (bech32) format per NIP-46
 */
export function generateNostrConnectURI(
  appPublicKey: string,
  relay: string,
  appName: string = 'Nostr CMS'
): string {
  // Convert hex public key to npub format if needed
  let npub: string;
  if (appPublicKey.startsWith('npub')) {
    npub = appPublicKey;
  } else {
    // Convert hex to npub
    try {
      npub = nip19.npubEncode(appPublicKey);
    } catch (error) {
      // If encoding fails, use as-is (might already be hex)
      npub = appPublicKey;
    }
  }
  
  const metadata = JSON.stringify({ 
    name: appName,
    url: typeof window !== 'undefined' ? window.location.origin : ''
  });
  
  const uri = `nostrconnect://${npub}?relay=${encodeURIComponent(relay)}&metadata=${encodeURIComponent(metadata)}`;
  return uri;
}

/**
 * Parse a Nostr Connect URI
 */
export function parseNostrConnectURI(uri: string): {
  publicKey: string;
  relay: string;
  metadata?: { name?: string };
} {
  if (!uri.startsWith('nostrconnect://')) {
    throw new Error('Invalid Nostr Connect URI');
  }

  const url = new URL(uri.replace('nostrconnect://', 'http://'));
  const publicKey = url.hostname;
  const relay = url.searchParams.get('relay') || '';
  const metadataParam = url.searchParams.get('metadata');
  const metadata = metadataParam ? JSON.parse(decodeURIComponent(metadataParam)) : undefined;

  return { publicKey, relay, metadata };
}

