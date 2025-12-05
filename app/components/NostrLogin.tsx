'use client';

import { useEffect, useState } from 'react';

export function NostrLogin() {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleAuthSuccess = () => {
      setTimeout(() => {
        window.location.href = '/studio';
      }, 300);
    };

    const handleAuthError = (e: Event) => {
      const customEvent = e as CustomEvent<{ error: string }>;
      console.error('Login error:', customEvent.detail?.error);
      setLoading(false);
    };

    window.addEventListener('nostr-login-success', handleAuthSuccess);
    window.addEventListener('nostr-login-error', handleAuthError);

    return () => {
      window.removeEventListener('nostr-login-success', handleAuthSuccess);
      window.removeEventListener('nostr-login-error', handleAuthError);
    };
  }, []);

  const handleLogin = async () => {
    setLoading(true);
    try {
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

