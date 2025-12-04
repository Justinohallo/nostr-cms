'use client';

import { useEffect } from 'react';

/**
 * NostrLoginProvider - Initializes nostr-login library
 * This must be mounted before any window.nostr calls are made
 */
export function NostrLoginProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize nostr-login on client side only
    import('nostr-login')
      .then(async ({ init }) => {
        await init({
          theme: 'default',
          startScreen: 'welcome',
          noBanner: true, // We'll handle UI ourselves
          onAuth: async (npub: string, options?: unknown) => {
            // Handle auth - create session on server
            try {
              // Get public key from window.nostr (should match npub parameter)
              const nostrWindow = window as typeof window & { nostr?: { getPublicKey: () => Promise<string>; signEvent: (event: any) => Promise<any> } };
              if (!nostrWindow.nostr) {
                throw new Error('window.nostr not available');
              }
              
              const publicKey = await nostrWindow.nostr.getPublicKey();
              
              // Create auth event
              const authEvent = {
                kind: 22242,
                created_at: Math.floor(Date.now() / 1000),
                tags: [],
                content: '',
              };

              // Sign auth event using nostr-login
              const signedEvent = await nostrWindow.nostr.signEvent(authEvent);

              // Send to server to create session
              const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ event: signedEvent }),
              });

              if (response.ok) {
                // Dispatch custom event to trigger page refresh
                window.dispatchEvent(new CustomEvent('nostr-login-success'));
              } else {
                console.error('Failed to create session:', await response.json());
              }
            } catch (error) {
              console.error('Error during nostr-login auth:', error);
            }
          },
        });
      })
      .catch((error) => {
        console.error('Failed to load nostr-login', error);
      });
  }, []);

  return <>{children}</>;
}

