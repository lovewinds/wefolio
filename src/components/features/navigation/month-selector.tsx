import type { ReactNode } from 'react';

interface MonthSelectorProps {
  year: number;
  month: number;
  navigationUnit?: 'month' | 'year';
  titleSuffix?: string;
  canPrev?: boolean;
  canNext?: boolean;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToggleNavigationUnit?: () => void;
  actions?: ReactNode;
}

export function MonthSelector({
  year,
  month,
  navigationUnit = 'month',
  titleSuffix = '요약',
  canPrev = true,
  canNext = true,
  onPrevMonth,
  onNextMonth,
  onToggleNavigationUnit,
  actions,
}: MonthSelectorProps) {
  const yearLabel = `${year}년`;
  const monthLabel = `${month}월`;
  const isYearMode = navigationUnit === 'year';
  const showClickableYear = Boolean(onToggleNavigationUnit);

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
          {showClickableYear ? (
            <button
              type="button"
              onClick={onToggleNavigationUnit}
              className={`rounded-md px-1 py-0.5 transition-colors hover:bg-zinc-200 dark:hover:bg-zinc-700 ${
                isYearMode ? 'text-blue-600 dark:text-blue-300' : 'text-zinc-800 dark:text-zinc-100'
              }`}
              aria-pressed={isYearMode}
            >
              {yearLabel}
            </button>
          ) : (
            yearLabel
          )}{' '}
          {monthLabel} {titleSuffix}
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
