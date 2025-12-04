'use client';

import { useState, useEffect } from 'react';
import { StructuredContentForm } from '../components/StructuredContentForm';
import { StructuredContentView } from '../components/StructuredContentView';
import { CredentialsError } from '../components/CredentialsError';
import Link from 'next/link';

interface StructuredContentItem {
  id: string;
  name: string;
  content: string;
  createdAt: string;
}

export default function StructuredContentPage() {
  const [items, setItems] = useState<StructuredContentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [credentialsError, setCredentialsError] = useState(false);

  const fetchStructuredContent = async () => {
    try {
      setFetching(true);
      const response = await fetch('/api/content/structured');
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
      console.error('Error fetching structured content:', error);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchStructuredContent();
  }, []);

  const handleSubmit = async (name: string, content: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/content/structured', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, content }),
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
        // Optimistically add/update the structured content immediately
        const newItem: StructuredContentItem = {
          id: data.id,
          name: data.name,
          content: data.content,
          createdAt: data.createdAt,
        };
        
        // Replace existing item with same name or add new one
        setItems((prevItems) => {
          const filtered = prevItems.filter((item) => item.name !== newItem.name);
          return [newItem, ...filtered];
        });
        
        // Refetch after a delay to ensure relay has indexed the event
        setTimeout(async () => {
          await fetchStructuredContent();
        }, 2000);
      }
    } catch (error) {
      console.error('Error posting structured content:', error);
      alert('Failed to publish structured content. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Get initial values for form from fetched items
  const getInitialValues = () => {
    const missionItem = items.find((item) => item.name === 'mission');
    const charterItem = items.find((item) => item.name === 'charter');
    const valuesItem = items.find((item) => item.name === 'values');

    return {
      mission: missionItem?.content || '',
      charter: charterItem?.content || '',
      values: valuesItem?.content || '',
    };
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <div className="w-full">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-3xl font-semibold text-black dark:text-zinc-50">
              Structured Content
            </h1>
            <Link
              href="/"
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              ← Back to Posts
            </Link>
          </div>
          
          {credentialsError ? (
            <CredentialsError />
          ) : (
            <>
              <div className="mb-8">
                <StructuredContentForm 
                  onSubmit={handleSubmit} 
                  isLoading={loading}
                  initialValues={getInitialValues()}
                />
              </div>

              <div className="mt-8">
                <h2 className="text-2xl font-semibold mb-4">Published Structured Content</h2>
                <StructuredContentView items={items} isLoading={fetching} />
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

