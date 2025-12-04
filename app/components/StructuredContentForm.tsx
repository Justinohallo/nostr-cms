'use client';

import { useForm } from 'react-hook-form';

interface StructuredContentFormProps {
  onSubmit: (name: string, content: string) => Promise<void>;
  isLoading?: boolean;
  initialValues?: {
    mission?: string;
    charter?: string;
    values?: string;
  };
}

type FormValues = {
  mission: string;
  charter: string;
  values: string;
};

export function StructuredContentForm({
  onSubmit,
  isLoading = false,
  initialValues
}: StructuredContentFormProps) {
  const { register, handleSubmit, watch, reset, formState: { isSubmitting, isDirty } } = useForm<FormValues>({
    defaultValues: {
      mission: initialValues?.mission || '',
      charter: initialValues?.charter || '',
      values: initialValues?.values || '',
    },
  });

  // Watch specific fields for button disabled state
  const missionValue = watch('mission') || '';
  const charterValue = watch('charter') || '';
  const valuesValue = watch('values') || '';

  const onSaveAll = async (data: FormValues) => {
    if (isLoading || !isDirty) return;

    // Save all three fields
    const saves = [];
    if (data.mission.trim()) {
      saves.push(onSubmit('mission', data.mission));
    }
    if (data.charter.trim()) {
      saves.push(onSubmit('charter', data.charter));
    }
    if (data.values.trim()) {
      saves.push(onSubmit('values', data.values));
    }

    if (saves.length > 0) {
      await Promise.all(saves);
      // Reset form to mark it as not dirty after successful submission
      reset(data, { keepValues: true });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSaveAll)} className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-semibold mb-2 text-black dark:text-white">
            Mission
          </label>
          <textarea
            {...register('mission')}
            placeholder="Enter your mission statement..."
            className="w-full p-4 border border-gray-300 rounded-lg dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            rows={4}
            disabled={isLoading || isSubmitting}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2 text-black dark:text-white">
            Charter
          </label>
          <textarea
            {...register('charter')}
            placeholder="Enter your charter..."
            className="w-full p-4 border border-gray-300 rounded-lg dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            rows={4}
            disabled={isLoading || isSubmitting}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2 text-black dark:text-white">
            Values
          </label>
          <textarea
            {...register('values')}
            placeholder="Enter your values..."
            className="w-full p-4 border border-gray-300 rounded-lg dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            rows={4}
            disabled={isLoading || isSubmitting}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading || isSubmitting || !isDirty || (!missionValue.trim() && !charterValue.trim() && !valuesValue.trim())}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading || isSubmitting ? 'Publishing...' : 'Publish'}
      </button>
    </form>
  );
}

