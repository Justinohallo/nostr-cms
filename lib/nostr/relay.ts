import { SimplePool, Event } from 'nostr-tools';

const relayUrl = process.env.NOSTR_RELAY_URL || 'wss://relay.damus.io';

/**
 * Publish an event to Nostr relay
 */
export async function publishEvent(event: Event): Promise<void> {
  const pool = new SimplePool();
  const relays = [relayUrl];

  try {
    const publishPromises = pool.publish(relays, event);
    const results = await Promise.allSettled(publishPromises);

    const hasSuccess = results.some(
      (result) => result.status === 'fulfilled' && result.value !== null
    );

    if (!hasSuccess) {
      throw new Error('Failed to publish event to relay');
    }

    // Give relay a moment to index the event before closing
    await new Promise((resolve) => setTimeout(resolve, 500));
  } finally {
    pool.close(relays);
  }
}

/**
 * Subscribe to events from Nostr relay
 */
export async function subscribeToEvents<T>(
  filter: {
    kinds: number[];
    authors: string[];
    '#d'?: string[];
  },
  transform: (event: Event) => T,
  timeout: number = 5000
): Promise<T[]> {
  const pool = new SimplePool();
  const relays = [relayUrl];
  const results: T[] = [];

  return new Promise<T[]>((resolve) => {
    const sub = pool.subscribeEose(relays, filter, {
      onevent: (event: Event) => {
        results.push(transform(event));
      },
      onclose: () => {
        pool.close(relays);
        resolve(results);
      },
      maxWait: timeout,
    });

    setTimeout(() => {
      sub.close();
      pool.close(relays);
      resolve(results);
    }, timeout);
  });
}

