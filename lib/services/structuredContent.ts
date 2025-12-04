import { SimplePool, Event } from 'nostr-tools';
import { getSession } from '@/lib/auth/session';

export interface StructuredContentItem {
  id: string;
  name: string;
  content: string;
  createdAt: string;
}

const relayUrl = process.env.NOSTR_RELAY_URL || 'wss://relay.damus.io';

/**
 * Server-side service to fetch structured content from Nostr
 * @param publicKey Optional public key to fetch content for. If not provided, uses authenticated user's key or site owner's key from env
 * @returns Array of structured content items
 */
export async function getStructuredContent(publicKey?: string): Promise<StructuredContentItem[]> {
  let targetPublicKey = publicKey;
  
  // If no public key provided, try to get from session
  if (!targetPublicKey) {
    const session = await getSession();
    if (session) {
      targetPublicKey = session.publicKey;
    }
  }
  
  // If still no public key, try environment variable for site owner
  if (!targetPublicKey) {
    targetPublicKey = process.env.NOSTR_PUBLIC_KEY;
  }
  
  if (!targetPublicKey) {
    console.error('No public key available for fetching content');
    return [];
  }
  
  const pool = new SimplePool();
  const relays = [relayUrl];

  return new Promise<StructuredContentItem[]>((resolve) => {
    const events: StructuredContentItem[] = [];

    // Build filter for structured content (kind 30000)
    const filter = {
      kinds: [30000],
      authors: [targetPublicKey],
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

