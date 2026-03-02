'use client';

import type { RecommendationItem } from './types';

interface RecommendationBarProps {
  recommendations: RecommendationItem[];
  isLoading: boolean;
  onSelect: (item: RecommendationItem) => void;
}

function ClockIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      fill="currentColor"
      className="size-3 shrink-0"
    >
      <path
        fillRule="evenodd"
        d="M1 8a7 7 0 1 1 14 0A7 7 0 0 1 1 8zm7-4.75a.75.75 0 0 1 .75.75v3.69l2.22 2.22a.75.75 0 1 1-1.06 1.06l-2.5-2.5A.75.75 0 0 1 7.25 8V4a.75.75 0 0 1 .75-.75z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function BookmarkIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      fill="currentColor"
      className="size-3 shrink-0"
    >
      <path d="M2 2a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v12.586l-4.293-4.293a1 1 0 0 0-1.414 0L4 14.586V2z" />
    </svg>
  );
}

export function RecommendationBar({
  recommendations,
  isLoading,
  onSelect,
}: RecommendationBarProps) {
  if (isLoading || recommendations.length === 0) return null;

  const templates = recommendations.filter(r => r.source === 'template');
  const lastMonth = recommendations.filter(r => r.source === 'lastMonth');

  return (
    <div className="rounded-xl border border-zinc-100 bg-zinc-50/60 p-3 dark:border-zinc-800 dark:bg-zinc-900/40">
      <div className="mb-3 flex items-center gap-1.5">
        <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">빠른 입력</span>
      </div>

      <div className="space-y-3">
        {templates.length > 0 && (
          <div>
            <div className="mb-1.5 flex items-center gap-1 text-xs font-medium text-zinc-400 dark:text-zinc-500">
              <BookmarkIcon />
              <span>고정 지출</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {templates.map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelect(item)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-sm text-violet-700 hover:border-violet-300 hover:bg-violet-100 dark:border-violet-800 dark:bg-violet-900/20 dark:text-violet-300 dark:hover:border-violet-700 dark:hover:bg-violet-900/30"
                >
                  <span>{item.label}</span>
                  {item.amount && (
                    <span className="text-xs text-violet-400 dark:text-violet-500">
                      {item.amount.toLocaleString()}원
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {lastMonth.length > 0 && (
          <div>
            <div className="mb-1.5 flex items-center gap-1 text-xs font-medium text-zinc-400 dark:text-zinc-500">
              <ClockIcon />
              <span>최근 카테고리</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {lastMonth.map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelect(item)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:bg-zinc-700"
                >
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
