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
            let isProcessing = false;

            await init({
                theme: 'default',
                startScreen: 'welcome',
                noBanner: true, // We'll handle UI ourselves
                onAuth: async (npub: string, options?: unknown) => {
                    // Prevent multiple simultaneous auth attempts
                    if (isProcessing) {
                        console.log('Auth already in progress, skipping...');
                        return;
                    }

                    // Check if already authenticated to prevent re-authentication loops
                    try {
                        const authCheck = await fetch('/api/auth/me');
                        const authData = await authCheck.json();
                        if (authData.authenticated) {
                            console.log('Already authenticated, skipping auth flow');
                            return;
                        }
                    } catch (err) {
                        // If check fails, proceed with auth (might be first time)
                        console.log('Auth check failed, proceeding with login');
                    }

                    isProcessing = true;

                    try {
                        // Get public key from window.nostr (should match npub parameter)
                        const nostrWindow = window as NostrWindow;
                        if (!nostrWindow.nostr) {
                            throw new Error('window.nostr not available');
                        }

                        // For NIP-46 (nsec.app), the npub parameter contains the public key
                        // We can decode it or use getPublicKey, but getPublicKey might trigger permission popup
                        // So we'll try to use npub directly, but still need to call signEvent which requires permission
                        // Extract hex public key from npub (it's bech32 encoded)
                        // For now, we'll call getPublicKey - if permissions are already granted, this won't popup
                        // If permissions aren't granted yet, this will request them (one-time)
                        let publicKey: string;
                        try {
                            publicKey = await nostrWindow.nostr.getPublicKey();
                        } catch (permError) {
                            // If getPublicKey fails, it might be a permission issue
                            // But for NIP-46, permissions should be requested during connection
                            console.warn('getPublicKey failed, this might indicate permission issue:', permError);
                            throw new Error('Failed to get public key. Please ensure permissions are granted.');
                        }

                        // Create auth event
                        const authEvent: NostrEvent = {
                            kind: 22242,
                            created_at: Math.floor(Date.now() / 1000),
                            tags: [],
                            content: '',
                        };

                        // Sign auth event - this requires signEvent permission
                        // For NIP-46, this should request permission if not already granted
                        // The permission popup should only appear once
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
                            // Small delay to ensure state is updated before redirect
                            await new Promise(resolve => setTimeout(resolve, 100));
                            // Dispatch custom event to trigger page refresh
                            window.dispatchEvent(new CustomEvent('nostr-login-success'));
                        } else {
                            const errorData = await response.json();
                            console.error('Failed to create session:', errorData);
                            throw new Error(errorData.message || 'Failed to create session');
                        }
                    } catch (error) {
                        console.error('Error during nostr-login auth:', error);
                        // Dispatch error event so UI can handle it
                        window.dispatchEvent(new CustomEvent('nostr-login-error', {
                            detail: { error: error instanceof Error ? error.message : 'Unknown error' }
                        }));
                    } finally {
                        // Reset processing flag after a delay to prevent immediate retry
                        setTimeout(() => {
                            isProcessing = false;
                        }, 2000);
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

