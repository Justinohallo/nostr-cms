'use client';

interface StructuredContentItem {
  id: string;
  name: string;
  content: string;
  createdAt: string;
}

interface StructuredContentViewProps {
  items: StructuredContentItem[];
  isLoading?: boolean;
}

export function StructuredContentView({ items, isLoading = false }: StructuredContentViewProps) {
  if (isLoading) {
    return <p className="text-gray-500 dark:text-gray-400">Loading...</p>;
  }

  if (items.length === 0) {
    return <p className="text-gray-500 dark:text-gray-400">No structured content published yet.</p>;
  }

  // Define the order we want to display items
  const displayOrder = ['mission', 'charter', 'values'];
  
  // Sort items according to display order
  const sortedItems = [...items].sort((a, b) => {
    const aIndex = displayOrder.indexOf(a.name);
    const bIndex = displayOrder.indexOf(b.name);
    
    // If both are in the order list, sort by order
    if (aIndex !== -1 && bIndex !== -1) {
      return aIndex - bIndex;
    }
    // If only one is in the order list, prioritize it
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;
    // If neither is in the order list, maintain original order
    return 0;
  });

  return (
    <div className="flex flex-col gap-6">
      {sortedItems.map((item) => (
        <div
          key={item.id}
          className="p-6 border border-gray-300 rounded-lg dark:border-gray-700 dark:bg-gray-800"
        >
          <div className="mb-3">
            <h3 className="text-xl font-semibold text-black dark:text-white capitalize">
              {item.name}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Last updated: {new Date(item.createdAt).toLocaleString()}
            </p>
          </div>
          <p className="text-black dark:text-white whitespace-pre-wrap">
            {item.content}
          </p>
        </div>
      ))}
    </div>
  );
}

