import Link from 'next/link';
import { getStructuredContent } from '@/lib/services/structuredContent';
import { StructuredContentDisplay } from './components/StructuredContentDisplay';

export default async function Home() {
  const items = await getStructuredContent();

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <div className="w-full">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-3xl font-semibold text-black dark:text-zinc-50">
              CMS
            </h1>
            <Link
              href="/studio"
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Studio →
            </Link>
          </div>
          
          <StructuredContentDisplay items={items} />
        </div>
      </main>
    </div>
  );
}
