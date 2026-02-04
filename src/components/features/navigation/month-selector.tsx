'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

interface MonthSelectorProps {
  year: number;
  month: number;
  titleSuffix?: string;
  canPrev?: boolean;
  canNext?: boolean;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onYearChange?: (year: number) => void;
  onMonthChange?: (month: number) => void;
  actions?: ReactNode;
}

export function MonthSelector({
  year,
  month,
  titleSuffix = '요약',
  canPrev = true,
  canNext = true,
  onPrevMonth,
  onNextMonth,
  onYearChange,
  onMonthChange,
  actions,
}: MonthSelectorProps) {
  const [openPopup, setOpenPopup] = useState<'year' | 'month' | null>(null);
  const yearRef = useRef<HTMLSpanElement>(null);
  const monthRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!openPopup) return;

    function handleClickOutside(e: MouseEvent) {
      const ref = openPopup === 'year' ? yearRef : monthRef;
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpenPopup(null);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openPopup]);

  const yearGrid = Array.from({ length: 9 }, (_, i) => year - 4 + i);

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <button
          onClick={onPrevMonth}
          className="rounded-md p-1.5 text-zinc-600 hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-40 dark:text-zinc-400 dark:hover:bg-zinc-700"
          aria-label="이전 달"
          disabled={!canPrev}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <h2 className="text-xl font-semibold text-zinc-800 dark:text-zinc-100">
          <span ref={yearRef} className="relative inline-block">
            {onYearChange ? (
              <button
                type="button"
                onClick={() => setOpenPopup(openPopup === 'year' ? null : 'year')}
                className="rounded-md px-1 py-0.5 transition-colors hover:bg-zinc-200 dark:hover:bg-zinc-700"
              >
                {year}년
              </button>
            ) : (
              `${year}년`
            )}
            {openPopup === 'year' && onYearChange && (
              <div className="absolute left-1/2 top-full z-20 mt-2 min-w-48 -translate-x-1/2 rounded-lg border border-zinc-200 bg-white p-3 shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
                <div className="grid grid-cols-3 gap-1.5">
                  {yearGrid.map(y => (
                    <button
                      key={y}
                      type="button"
                      onClick={() => {
                        onYearChange(y);
                        setOpenPopup(null);
                      }}
                      className={`rounded-md px-2 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                        y === year
                          ? 'bg-blue-600 text-white dark:bg-blue-500'
                          : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-700'
                      }`}
                    >
                      {y}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </span>{' '}
          <span ref={monthRef} className="relative inline-block">
            {onMonthChange ? (
              <button
                type="button"
                onClick={() => setOpenPopup(openPopup === 'month' ? null : 'month')}
                className="rounded-md px-1 py-0.5 transition-colors hover:bg-zinc-200 dark:hover:bg-zinc-700"
              >
                {month}월
              </button>
            ) : (
              `${month}월`
            )}
            {openPopup === 'month' && onMonthChange && (
              <div className="absolute left-1/2 top-full z-20 mt-2 min-w-44 -translate-x-1/2 rounded-lg border border-zinc-200 bg-white p-3 shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
                <div className="grid grid-cols-4 gap-1.5">
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => {
                        onMonthChange(m);
                        setOpenPopup(null);
                      }}
                      className={`rounded-md px-2 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                        m === month
                          ? 'bg-blue-600 text-white dark:bg-blue-500'
                          : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-700'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </span>{' '}
          {titleSuffix}
        </h2>
        <button
          onClick={onNextMonth}
          className="rounded-md p-1.5 text-zinc-600 hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-40 dark:text-zinc-400 dark:hover:bg-zinc-700"
          aria-label="다음 달"
          disabled={!canNext}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
