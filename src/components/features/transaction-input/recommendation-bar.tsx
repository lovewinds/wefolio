'use client';

import type { RecommendationItem } from './types';

interface RecommendationBarProps {
  recommendations: RecommendationItem[];
  isLoading: boolean;
  onSelect: (item: RecommendationItem) => void;
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
    <div className="space-y-3">
      {templates.length > 0 && (
        <div>
          <div className="mb-1.5 text-xs font-medium text-zinc-400 dark:text-zinc-500">
            고정 지출
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
          <div className="mb-1.5 text-xs font-medium text-zinc-400 dark:text-zinc-500">최근 카테고리</div>
          <div className="flex flex-wrap gap-2">
            {lastMonth.map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelect(item)}
                className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-sm text-zinc-600 hover:border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:bg-zinc-700"
              >
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
