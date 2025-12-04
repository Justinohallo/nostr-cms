'use client';

import { useState, useEffect } from 'react';
import { ContentForm } from './components/ContentForm';
import { ContentView } from './components/ContentView';
import { CredentialsError } from './components/CredentialsError';

interface ContentItem {
  id: string;
  content: string;
  createdAt: string;
}

export default function Home() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [credentialsError, setCredentialsError] = useState(false);

  const fetchContent = async () => {
    try {
      setFetching(true);
      const response = await fetch('/api/content');
      const data = await response.json();
      
      if (data.error === 'NOSTR_CREDENTIALS_MISSING') {
        setCredentialsError(true);
        return;
      }
      
      setCredentialsError(false);
      if (data.items) {
        setItems(data.items);
      }
    } catch (error) {
      console.error('Error fetching content:', error);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchContent();
  }, []);

  const handleSubmit = async (content: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });

      const data = await response.json();

      if (data.error === 'NOSTR_CREDENTIALS_MISSING') {
        setCredentialsError(true);
        return;
      }

      if (data.error) {
        console.error('Error from API:', data.error, data.message);
        alert(`Failed to publish: ${data.message || data.error}`);
        return;
      }

      if (data.success) {
        // Optimistically add the new post immediately
        const newItem: ContentItem = {
          id: data.id,
          content: data.content,
          createdAt: data.createdAt,
        };
        
        // Add to the beginning of the list (most recent first)
        setItems((prevItems) => [newItem, ...prevItems]);
        
        // Refetch after a delay to ensure relay has indexed the event
        // This ensures we have the latest data and handles any edge cases
        setTimeout(async () => {
          await fetchContent();
        }, 2000);
      }
    } catch (error) {
      console.error('Error posting content:', error);
      alert('Failed to publish content. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <div className="w-full">
          <h1 className="text-3xl font-semibold mb-8 text-black dark:text-zinc-50">
            CMS
          </h1>
          
          {credentialsError ? (
            <CredentialsError />
          ) : (
            <>
              <div className="mb-8">
                <ContentForm onSubmit={handleSubmit} isLoading={loading} />
              </div>

              <div className="mt-8">
                <h2 className="text-2xl font-semibold mb-4">Published Content</h2>
                <ContentView items={items} isLoading={fetching} />
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
