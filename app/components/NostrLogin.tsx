'use client';

import { useRef, useState } from 'react';

let hasRedirected = false;

export function NostrLogin() {
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      // Set up event listeners when login is initiated
      const handleAuthSuccess = async () => {
        if (hasRedirected) return;
        hasRedirected = true;

        // Wait a bit longer to ensure session cookie is set and auth state can update
        await new Promise(resolve => setTimeout(resolve, 300));

        // Use reload instead of href to ensure full page refresh and auth state check
        window.location.href = '/studio';
      };

      const handleAuthError = (e: Event) => {
        const customEvent = e as CustomEvent<{ error: string }>;
        console.error('Login error:', customEvent.detail?.error);
        setLoading(false);
      };

      const handleNlAuth = (e: Event) => {
        const customEvent = e as CustomEvent<{ type?: string }>;
        if (customEvent.detail?.type === 'login' || customEvent.detail?.type === 'signup') {
          handleAuthSuccess();
        }
      };

      // Add listeners
      window.addEventListener('nostr-login-success', handleAuthSuccess, { once: true });
      window.addEventListener('nostr-login-error', handleAuthError, { once: true });
      document.addEventListener('nlAuth', handleNlAuth, { once: true });

      // Use nostr-login's launch function to show auth UI
      const { launch } = await import('nostr-login');
      await launch('welcome');
    } catch (error) {
      console.error('Failed to launch nostr-login:', error);
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-6 p-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-black dark:text-white mb-2">
          Connect with Nostr
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Click the button below to login with your Nostr account
        </p>
      </div>

      <button
        onClick={handleLogin}
        disabled={loading}
        className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-lg font-semibold"
      >
        {loading ? 'Loading...' : 'Login with Nostr'}
      </button>

      <div className="mt-6 text-sm text-gray-500 dark:text-gray-400 text-center max-w-md">
        <p>
          Supports NIP-46 (Nostr Connect), browser extensions, and more.
        </p>
      </div>
    </div>
  );
}

