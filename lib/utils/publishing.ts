interface NostrWindow extends Window {
  nostr?: {
    signEvent: (event: {
      kind: number;
      created_at: number;
      tags: string[][];
      content: string;
    }) => Promise<{
      id: string;
      pubkey: string;
      created_at: number;
      kind: number;
      tags: string[][];
      content: string;
      sig: string;
    }>;
  };
}

/**
 * Sign a structured content event using window.nostr
 */
export async function signEvent(name: string, content: string): Promise<{
  id: string;
  pubkey: string;
  created_at: number;
  kind: number;
  tags: string[][];
  content: string;
  sig: string;
}> {
  const nostrWindow = typeof window !== 'undefined' ? (window as NostrWindow) : null;

  if (!nostrWindow?.nostr) {
    throw new Error('Nostr login not available. Please refresh the page and login again.');
  }

  const eventTemplate = {
    kind: 30000,
    created_at: Math.floor(Date.now() / 1000),
    tags: [['d', name]],
    content,
  };

  return await nostrWindow.nostr.signEvent(eventTemplate);
}

/**
 * Publish a signed event to the API
 */
export async function publishEvent(signedEvent: {
  id: string;
  pubkey: string;
  created_at: number;
  kind: number;
  tags: string[][];
  content: string;
  sig: string;
}): Promise<{
  success: boolean;
  id: string;
  name: string;
  content: string;
  createdAt: string;
  error?: string;
  message?: string;
}> {
  const response = await fetch('/api/content/structured', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ event: signedEvent }),
  });

  const data = await response.json();

  if (data.error) {
    throw new Error(data.message || data.error);
  }

  return data;
}

