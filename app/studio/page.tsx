'use client';

import { publishEvent, signEvent } from '@/lib/utils/publishing';
import { useMemo, useState } from 'react';

import { ErrorMessage } from '../components/ErrorMessage';
import Link from 'next/link';
import { NostrLogin } from '../components/NostrLogin';
import { StructuredContentForm } from '../components/StructuredContentForm';
import { useAuth } from '@/lib/hooks/useAuth';
import { useStructuredContent } from '@/lib/hooks/useStructuredContent';

export default function StudioPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { authenticated, publicKey, loading: authLoading, logout } = useAuth();
  const { items, isLoading, mutate } = useStructuredContent();

  const handleSubmit = async (name: string, content: string) => {
    if (!authenticated || !publicKey) {
      setError('You must be logged in to publish content');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const signedEvent = await signEvent(name, content);
      const data = await publishEvent(signedEvent);

      if (data.success) {
        // Optimistic update
        mutate((current) => {
          if (!current) return { items: [{ id: data.id, name: data.name, content: data.content, createdAt: data.createdAt }] };
          const filtered = current.items.filter((item) => item.name !== data.name);
          return { items: [{ id: data.id, name: data.name, content: data.content, createdAt: data.createdAt }, ...filtered] };
        });

        // Refetch after a delay to get the latest from relay
        setTimeout(() => mutate(), 2000);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to publish structured content. Please try again.';
      setError(errorMessage);
      console.error('Error posting structured content:', err);
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

          {error && (
            <ErrorMessage
              message={error}
              onDismiss={() => setError(null)}
            />
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-500 dark:text-gray-400">Loading...</div>
            </div>
          ) : (
            <StructuredContentForm
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

