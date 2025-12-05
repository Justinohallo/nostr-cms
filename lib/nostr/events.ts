import { Event } from 'nostr-tools';

export interface StructuredContentItem {
  id: string;
  name: string;
  content: string;
  createdAt: string;
}

/**
 * Extract name from event's d tag
 */
export function extractEventName(event: Event): string {
  const dTag = event.tags.find((tag) => tag[0] === 'd');
  return dTag ? dTag[1] : 'unknown';
}

/**
 * Transform Nostr event to StructuredContentItem
 */
export function transformEventToItem(event: Event): StructuredContentItem {
  return {
    id: event.id,
    name: extractEventName(event),
    content: event.content,
    createdAt: new Date(event.created_at * 1000).toISOString(),
  };
}

/**
 * Sort items by creation date (newest first)
 */
export function sortItemsByDate(items: StructuredContentItem[]): StructuredContentItem[] {
  return [...items].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

