'use client';

import { useState, useEffect } from 'react';

interface StructuredContentFormProps {
  onSubmit: (name: string, content: string) => Promise<void>;
  isLoading?: boolean;
  initialValues?: {
    mission?: string;
    charter?: string;
    values?: string;
  };
}

export function StructuredContentForm({ 
  onSubmit, 
  isLoading = false,
  initialValues 
}: StructuredContentFormProps) {
  const [mission, setMission] = useState(initialValues?.mission || '');
  const [charter, setCharter] = useState(initialValues?.charter || '');
  const [values, setValues] = useState(initialValues?.values || '');

  // Update form when initialValues change
  useEffect(() => {
    if (initialValues) {
      setMission(initialValues.mission || '');
      setCharter(initialValues.charter || '');
      setValues(initialValues.values || '');
    }
  }, [initialValues]);

  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    // Save all three fields
    const saves = [];
    if (mission.trim()) {
      saves.push(onSubmit('mission', mission));
    }
    if (charter.trim()) {
      saves.push(onSubmit('charter', charter));
    }
    if (values.trim()) {
      saves.push(onSubmit('values', values));
    }

    if (saves.length > 0) {
      await Promise.all(saves);
    }
  };

  const handleSaveField = async (name: string, content: string) => {
    if (!content.trim() || isLoading) return;
    await onSubmit(name, content);
  };

  return (
    <form onSubmit={handleSaveAll} className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-semibold mb-2 text-black dark:text-white">
            Mission
          </label>
          <textarea
            value={mission}
            onChange={(e) => setMission(e.target.value)}
            placeholder="Enter your mission statement..."
            className="w-full p-4 border border-gray-300 rounded-lg dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            rows={4}
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => handleSaveField('mission', mission)}
            disabled={isLoading || !mission.trim()}
            className="mt-2 px-4 py-2 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save Mission
          </button>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2 text-black dark:text-white">
            Charter
          </label>
          <textarea
            value={charter}
            onChange={(e) => setCharter(e.target.value)}
            placeholder="Enter your charter..."
            className="w-full p-4 border border-gray-300 rounded-lg dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            rows={4}
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => handleSaveField('charter', charter)}
            disabled={isLoading || !charter.trim()}
            className="mt-2 px-4 py-2 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save Charter
          </button>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2 text-black dark:text-white">
            Values
          </label>
          <textarea
            value={values}
            onChange={(e) => setValues(e.target.value)}
            placeholder="Enter your values..."
            className="w-full p-4 border border-gray-300 rounded-lg dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            rows={4}
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => handleSaveField('values', values)}
            disabled={isLoading || !values.trim()}
            className="mt-2 px-4 py-2 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save Values
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading || (!mission.trim() && !charter.trim() && !values.trim())}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Saving...' : 'Save All'}
      </button>
    </form>
  );
}

