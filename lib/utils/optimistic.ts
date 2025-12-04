import { StructuredContentItem } from '@/lib/nostr/events';

interface StructuredContentResponse {
  items: StructuredContentItem[];
}

/**
 * Merge fetched data with optimistic updates, preferring newer content
 */
export function mergeOptimisticUpdate(
  current: StructuredContentResponse | null,
  fetched: StructuredContentItem[]
): StructuredContentResponse {
  if (!current) {
    return { items: fetched };
  }

  // Merge fetched data with optimistic update, preferring newer content
  const mergedItems = fetched.map((fetchedItem) => {
    const optimisticItem = current.items.find((item) => item.name === fetchedItem.name);
    if (optimisticItem && new Date(optimisticItem.createdAt) > new Date(fetchedItem.createdAt)) {
      // Keep optimistic update if it's newer
      return optimisticItem;
    }
    return fetchedItem;
  });

  // Add any items from optimistic update that aren't in fetched data yet
  current.items.forEach((optimisticItem) => {
    if (!mergedItems.find((item) => item.name === optimisticItem.name)) {
      mergedItems.push(optimisticItem);
    }
  });

  return { items: mergedItems };
}

