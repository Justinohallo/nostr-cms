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
      // Sign event client-side using NIP-07, manual key, or NIP-46
      let signedEvent;
      
      const eventTemplate = {
        kind: 30000,
        created_at: Math.floor(Date.now() / 1000),
        tags: [['d', name]],
        content,
      };

      if (typeof window !== 'undefined' && (window as any).nostr) {
        // Use NIP-07 browser extension
        signedEvent = await (window as any).nostr.signEvent(eventTemplate);
      } else if (typeof window !== 'undefined') {
        // Try to use stored private key from manual login
        const storedKey = sessionStorage.getItem('nostr_private_key');
        if (storedKey) {
          try {
            const { getPublicKey, finalizeEvent } = await import('nostr-tools');
            const { hexToBytes } = await import('@noble/hashes/utils');
            const { decode, NostrTypeGuard } = await import('nostr-tools/nip19');

            let privateKeyBytes: Uint8Array;
            const trimmedKey = storedKey.trim();

            // Handle nsec format
            if (NostrTypeGuard.isNSec(trimmedKey)) {
              const decoded = decode(trimmedKey);
              if (decoded.type === 'nsec') {
                privateKeyBytes = decoded.data;
              } else {
                throw new Error('Invalid nsec format');
              }
            } else {
              // Handle hex format
              let normalizedKey = trimmedKey.toLowerCase();
              if (normalizedKey.startsWith('0x')) {
                normalizedKey = normalizedKey.slice(2);
              }
              if (!/^[0-9a-f]+$/.test(normalizedKey)) {
                throw new Error('Invalid hex characters');
              }
              if (normalizedKey.length === 63) {
                normalizedKey = '0' + normalizedKey;
              }
              if (normalizedKey.length !== 64) {
                throw new Error('Invalid private key length');
              }
              privateKeyBytes = hexToBytes(normalizedKey);
            }

            // Verify the stored key matches the authenticated public key
            const keyPublicKey = getPublicKey(privateKeyBytes);
            if (keyPublicKey !== publicKey) {
              throw new Error('Stored private key does not match authenticated user');
            }

            signedEvent = finalizeEvent(eventTemplate, privateKeyBytes);
          } catch (err) {
            console.error('Error signing with stored key:', err);
            alert('Failed to sign event. Please log out and log back in.');
            setLoading(false);
            return;
          }
        } else {
          // No stored key and no NIP-07 extension
          alert('Please install a Nostr browser extension (like Alby or nos2x) to sign events, or log out and log back in with your private key.');
          setLoading(false);
          return;
        }
      } else {
        alert('Unable to sign events in this environment');
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

