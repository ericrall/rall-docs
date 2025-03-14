import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
      <h1 className="text-4xl font-bold mb-4">Rall Docs</h1>
      <Link href="/editor" className="text-blue-500 hover:underline">
        Open Editor
      </Link>
    </div>
  );
} 