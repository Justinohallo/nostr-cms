'use client';

import { useState } from 'react';

interface ContentFormProps {
  onSubmit: (content: string) => Promise<void>;
  isLoading?: boolean;
}

export function ContentForm({ onSubmit, isLoading = false }: ContentFormProps) {
  const [content, setContent] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isLoading) return;

    await onSubmit(content);
    setContent('');
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Enter your content here..."
        className="w-full p-4 border border-gray-300 rounded-lg dark:border-gray-700 dark:bg-gray-800 dark:text-white"
        rows={4}
        disabled={isLoading}
      />
      <button
        type="submit"
        disabled={isLoading || !content.trim()}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Publishing...' : 'Publish'}
      </button>
    </form>
  );
}

