'use client';

import { useState, useMemo } from 'react';
import { StructuredContentForm } from '../components/StructuredContentForm';
import { NostrLogin } from '../components/NostrLogin';
import Link from 'next/link';
import { useStructuredContent } from '@/lib/hooks/useStructuredContent';
import { useAuth } from '@/lib/hooks/useAuth';

export default function StudioPage() {
  const [loading, setLoading] = useState(false);
  const { authenticated, publicKey, loading: authLoading, logout } = useAuth();
  const { items, isLoading, mutate } = useStructuredContent();

  const handleSubmit = async (name: string, content: string) => {
    if (!authenticated || !publicKey) {
      alert('You must be logged in to publish content');
      return;
    }

    setLoading(true);
    try {
      // Sign event client-side using NIP-07 or NIP-46
      let signedEvent;
      
      if (typeof window !== 'undefined' && (window as any).nostr) {
        // Use NIP-07 browser extension
        const eventTemplate = {
          kind: 30000,
          created_at: Math.floor(Date.now() / 1000),
          tags: [['d', name]],
          content,
        };
        
        signedEvent = await (window as any).nostr.signEvent(eventTemplate);
      } else {
        // For NIP-46, we'd need to implement the full protocol
        // For now, show an error
        alert('Please install a Nostr browser extension (like Alby or nos2x) to sign events');
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
        // Optimistically update
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
        
        // Revalidate after a delay to ensure relay has indexed the event
        setTimeout(() => {
          mutate();
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
              key={JSON.stringify(initialValues)}
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

