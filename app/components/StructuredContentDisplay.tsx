import { StructuredContentItem } from '@/lib/services/structuredContent';

interface StructuredContentDisplayProps {
  items: StructuredContentItem[];
}

export function StructuredContentDisplay({ items }: StructuredContentDisplayProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">
          No structured content available yet.
        </p>
      </div>
    );
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
    <div className="flex flex-col gap-8">
      {sortedItems.map((item) => (
        <div
          key={item.id}
          className="p-6 border border-gray-300 rounded-lg dark:border-gray-700 dark:bg-gray-800"
        >
          <h2 className="text-2xl font-semibold text-black dark:text-white capitalize mb-4">
            {item.name}
          </h2>
          <p className="text-black dark:text-white whitespace-pre-wrap leading-relaxed">
            {item.content}
          </p>
        </div>
      ))}
    </div>
  );
}

