'use client';

interface NostrEvent {
  kind: number;
  created_at: number;
  tags: string[][];
  content: string;
}

interface SignedNostrEvent extends NostrEvent {
  id: string;
  pubkey: string;
  sig: string;
}

interface NostrWindow extends Window {
  nostr?: {
    getPublicKey: () => Promise<string>;
    signEvent: (event: NostrEvent) => Promise<SignedNostrEvent>;
  };
}

let isInitialized = false;
let initPromise: Promise<void> | null = null;

/**
 * Initialize nostr-login library (called once, lazily)
 */
function initializeNostrLogin() {
  if (isInitialized) return Promise.resolve();
  if (initPromise) return initPromise;

  initPromise = import('nostr-login')
    .then(async ({ init }) => {
      await init({
        theme: 'default',
        startScreen: 'welcome',
        noBanner: true,
        perms: 'getPublicKey,sign_event:0,sign_event:1,sign_event:3,sign_event:6,sign_event:7,sign_event:9735,sign_event:10000,sign_event:10002,sign_event:22242,sign_event:27235,sign_event:30000,sign_event:30023,nip04_encrypt,nip04_decrypt,nip44_encrypt,nip44_decrypt',
        onAuth: async () => {
          try {
            const nostrWindow = window as NostrWindow;
            if (!nostrWindow.nostr) {
              throw new Error('window.nostr not available');
            }

            // Verify nostr is available by getting public key
            await nostrWindow.nostr.getPublicKey();

            const authEvent: NostrEvent = {
              kind: 22242,
              created_at: Math.floor(Date.now() / 1000),
              tags: [],
              content: '',
            };

            const signedEvent = await nostrWindow.nostr.signEvent(authEvent);
            const response = await fetch('/api/auth/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ event: signedEvent }),
            });

            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.message || 'Failed to create session');
            }

            setTimeout(() => {
              window.dispatchEvent(new CustomEvent('nostr-login-success'));
            }, 100);
          } catch (error) {
            console.error('Error during nostr-login auth:', error);
            window.dispatchEvent(new CustomEvent('nostr-login-error', {
              detail: { error: error instanceof Error ? error.message : 'Unknown error' }
            }));
          }
        },
      });

      isInitialized = true;
    })
    .catch((error) => {
      console.error('Failed to load nostr-login', error);
      initPromise = null; // Reset on error so we can retry
      throw error;
    });

  return initPromise;
}

/**
 * NostrLoginProvider - Initializes nostr-login library
 * This must be mounted before any window.nostr calls are made
 */
export function NostrLoginProvider({ children }: { children: React.ReactNode }) {
  // Initialize on first render (client-side only)
  if (typeof window !== 'undefined') {
    initializeNostrLogin();
  }

  return <>{children}</>;
}

