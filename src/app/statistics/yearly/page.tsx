'use client';

import { useState } from 'react';
import { LNB } from '@/components/features/layout';

function getCurrentYear() {
  return new Date().getFullYear();
}

export default function YearlySummaryPage() {
  const [selectedYear, setSelectedYear] = useState(getCurrentYear);

  const handlePrevYear = () => setSelectedYear(y => y - 1);
  const handleNextYear = () => setSelectedYear(y => y + 1);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <LNB />
      <main className="ml-16 px-8 py-8">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">연간 요약</h2>
          <div className="flex items-center gap-4">
            <button
              onClick={handlePrevYear}
              className="rounded-lg p-2 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <span className="min-w-[80px] text-center text-lg font-medium text-zinc-900 dark:text-zinc-50">
              {selectedYear}년
            </span>
            <button
              onClick={handleNextYear}
              className="rounded-lg p-2 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-center text-zinc-500 dark:text-zinc-400">
            연간 요약 기능이 준비 중입니다.
          </p>
        </div>
      </main>
    </div>
  );
}
