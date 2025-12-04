import { getSession } from '@/lib/auth/session';
import { subscribeToEvents } from '@/lib/nostr/relay';
import { transformEventToItem, sortItemsByDate } from '@/lib/nostr/events';
import type { StructuredContentItem } from '@/lib/nostr/events';

// Re-export for convenience
export type { StructuredContentItem };

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

  const filter = {
    kinds: [30000],
    authors: [targetPublicKey],
  };

  const items = await subscribeToEvents(filter, transformEventToItem);
  return sortItemsByDate(items);
}

