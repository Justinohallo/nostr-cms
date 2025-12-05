import { useCallback, useEffect, useState } from 'react';

import { StructuredContentItem } from '@/lib/nostr/events';

// Re-export for convenience
export type { StructuredContentItem };

interface StructuredContentResponse {
  items: StructuredContentItem[];
  error?: string;
  message?: string;
}

async function fetchStructuredContent(): Promise<StructuredContentResponse> {
  const response = await fetch('/api/content/structured');
  const data = await response.json();

  if (data.error === 'NOSTR_CREDENTIALS_MISSING') {
    const error = new Error('NOSTR_CREDENTIALS_MISSING') as Error & { credentialsError?: boolean };
    error.credentialsError = true;
    throw error;
  }

  return data;
}

export function useStructuredContent() {
  const [data, setData] = useState<StructuredContentResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const fetchedData = await fetchStructuredContent();
      setData(fetchedData);
    } catch (e) {
      setError(e as Error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    refetch();
  }, [refetch]);

  const credentialsError = (error as any)?.credentialsError === true;

  const mutate = useCallback(async (updater?: (current: StructuredContentResponse | null) => StructuredContentResponse | null) => {
    if (updater) {
      const updated = updater(data);
      if (updated) {
        setData(updated);
        setIsLoading(false);
      }
    } else {
      await refetch();
    }
  }, [data, refetch]);

  return {
    items: data?.items || [],
    isLoading,
    isError: error && !credentialsError,
    credentialsError,
    mutate,
  };
}
