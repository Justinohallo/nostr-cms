'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import Link from 'next/link';
import { NostrLogin } from '../components/NostrLogin';
import { StructuredContentForm } from '../components/StructuredContentForm';
import { useAuth } from '@/lib/hooks/useAuth';
import { useStructuredContent } from '@/lib/hooks/useStructuredContent';

// Type for window.nostr from nostr-login
type NostrWindow = typeof window & {
  nostr?: {
    getPublicKey: () => Promise<string>;
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
};

export default function StudioPage() {
  const [loading, setLoading] = useState(false);
  const { authenticated, publicKey, loading: authLoading, logout } = useAuth();
  const { items, isLoading, mutate } = useStructuredContent();
  const formKeyRef = useRef(0);
  const prevValuesRef = useRef<string>('');

  const handleSubmit = async (name: string, content: string) => {
    if (!authenticated || !publicKey) {
      alert('You must be logged in to publish content');
      return;
    }

    setLoading(true);
    try {
      // Sign event client-side using NIP-07, manual key, or NIP-46
      let signedEvent;

      const eventTemplate = {
        kind: 30000,
        created_at: Math.floor(Date.now() / 1000),
        tags: [['d', name]],
        content,
      };

      // Use window.nostr from nostr-login library
      const nostrWindow = typeof window !== 'undefined' ? (window as NostrWindow) : null;

      if (nostrWindow?.nostr) {
        // nostr-login handles all signing (NIP-07, NIP-46, local, etc.)
        signedEvent = await nostrWindow.nostr.signEvent(eventTemplate);
      } else {
        alert('Nostr login not available. Please refresh the page and login again.');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/content/structured', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ event: signedEvent }),
      });

      const data = await response.json();

      if (data.error) {
        console.error('Error from API:', data.error, data.message);
        alert(`Failed to publish: ${data.message || data.error}`);
        return;
      }

      if (data.success) {
        // Optimistically update without triggering loading state
        const newItem = {
          id: data.id,
          name: data.name,
          content: data.content,
          createdAt: data.createdAt,
        };

        mutate((current) => {
          if (!current) return { items: [newItem] };
          const filtered = current.items.filter((item) => item.name !== newItem.name);
          return { items: [newItem, ...filtered] };
        });

        // Silently refetch after a delay to sync with relay (background, no loading state)
        setTimeout(async () => {
          try {
            // Direct fetch without going through mutate to avoid loading state
            const response = await fetch('/api/content/structured');
            const fetchedData = await response.json();
            if (fetchedData.items) {
              // Update data silently without triggering loading
              mutate((current) => ({ items: fetchedData.items }));
            }
          } catch (err) {
            console.error('Background refetch error:', err);
            // Silently fail - optimistic update is already shown
          }
        }, 2000);
      }
    } catch (error) {
      console.error('Error posting structured content:', error);
      alert('Failed to publish structured content. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Memoize initial values to prevent unnecessary re-renders
  const initialValues = useMemo(() => {
    const missionItem = items.find((item) => item.name === 'mission');
    const charterItem = items.find((item) => item.name === 'charter');
    const valuesItem = items.find((item) => item.name === 'values');

    return {
      mission: missionItem?.content || '',
      charter: charterItem?.content || '',
      values: valuesItem?.content || '',
    };
  }, [items]);

  // Only update form key when values actually change (prevents unnecessary remounts)
  useEffect(() => {
    const valuesString = JSON.stringify(initialValues);
    if (valuesString !== prevValuesRef.current) {
      prevValuesRef.current = valuesString;
      formKeyRef.current += 1;
    }
  }, [initialValues]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
        <div className="text-gray-500 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
        <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
          <div className="w-full">
            <div className="mb-6 flex items-center justify-between">
              <h1 className="text-3xl font-semibold text-black dark:text-zinc-50">
                Studio
              </h1>
              <Link
                href="/"
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                ← View Site
              </Link>
            </div>
            <NostrLogin />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <div className="w-full">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-3xl font-semibold text-black dark:text-zinc-50">
              Studio
            </h1>
            <div className="flex items-center gap-4">
              {publicKey && (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {publicKey.slice(0, 8)}...{publicKey.slice(-8)}
                </div>
              )}
              <button
                onClick={logout}
                className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
              >
                Logout
              </button>
              <Link
                href="/"
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                ← View Site
              </Link>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-500 dark:text-gray-400">Loading...</div>
            </div>
          ) : (
            <StructuredContentForm
              key={formKeyRef.current}
              onSubmit={handleSubmit}
              isLoading={loading}
              initialValues={initialValues}
            />
          )}
        </div>
      </main>
    </div>
  );
}

