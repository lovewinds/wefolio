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
        <h2 className="text-lg font-semibold text-loss">문제가 발생했습니다</h2>
        <p className="mt-2 text-sm text-ink-muted">
          {error.message || '알 수 없는 오류가 발생했습니다.'}
        </p>
        <button
          onClick={reset}
          className="mt-4 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-on-accent transition-colors hover:bg-accent-press"
        >
          다시 시도
        </button>
      </div>
    </main>
  );
}
