'use client';

import { useEffect } from 'react';

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center px-8 py-8">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-rose-600 dark:text-rose-400">
          문제가 발생했습니다
        </h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          {error.message || '알 수 없는 오류가 발생했습니다.'}
        </p>
        <button
          onClick={reset}
          className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
        >
          다시 시도
        </button>
      </div>
    </main>
  );
}
