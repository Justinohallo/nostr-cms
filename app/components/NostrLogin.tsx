'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function NostrLogin() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    setLoading(true);
    try {
      // Use nostr-login's launch function to show auth UI
      const { launch } = await import('nostr-login');
      await launch('welcome');
    } catch (error) {
      console.error('Failed to launch nostr-login:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Listen for nostr-login success event
    const handleAuthSuccess = () => {
      router.refresh();
      window.location.href = '/studio';
    };

    window.addEventListener('nostr-login-success', handleAuthSuccess);
    
    // Also listen for nlAuth event from nostr-login
    const handleNlAuth = (e: any) => {
      if (e.detail?.type === 'login' || e.detail?.type === 'signup') {
        handleAuthSuccess();
      }
    };

    document.addEventListener('nlAuth', handleNlAuth);

    return () => {
      window.removeEventListener('nostr-login-success', handleAuthSuccess);
      document.removeEventListener('nlAuth', handleNlAuth);
    };
  }, [router]);

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

