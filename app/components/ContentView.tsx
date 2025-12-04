'use client';

interface ContentItem {
  id: string;
  content: string;
  createdAt: string;
}

interface ContentViewProps {
  items: ContentItem[];
  isLoading?: boolean;
}

export function ContentView({ items, isLoading = false }: ContentViewProps) {
  if (isLoading) {
    return <p className="text-gray-500 dark:text-gray-400">Loading...</p>;
  }

  if (items.length === 0) {
    return <p className="text-gray-500 dark:text-gray-400">No content published yet.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {items.map((item) => (
        <div
          key={item.id}
          className="p-4 border border-gray-300 rounded-lg dark:border-gray-700 dark:bg-gray-800"
        >
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
            {new Date(item.createdAt).toLocaleString()}
          </p>
          <p className="text-black dark:text-white whitespace-pre-wrap">
            {item.content}
          </p>
        </div>
      ))}
    </div>
  );
}

