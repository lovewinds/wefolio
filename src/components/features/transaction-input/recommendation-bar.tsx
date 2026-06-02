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
    <div className="rounded-xl border border-hairline-soft bg-surface-soft p-3">
      <div className="mb-3 flex items-center gap-1.5">
        <span className="text-xs font-semibold text-ink-subtle">빠른 입력</span>
      </div>

      <div className="space-y-3">
        {templates.length > 0 && (
          <div>
            <div className="mb-1.5 flex items-center gap-1 text-xs font-medium text-ink-subtle">
              <BookmarkIcon />
              <span>고정 지출</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {templates.map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelect(item)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-accent accent-soft px-3 py-1.5 text-sm text-accent hover:border-accent"
                >
                  <span>{item.label}</span>
                  {item.amount && (
                    <span className="text-xs text-accent">{item.amount.toLocaleString()}원</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {lastMonth.length > 0 && (
          <div>
            <div className="mb-1.5 flex items-center gap-1 text-xs font-medium text-ink-subtle">
              <ClockIcon />
              <span>최근 카테고리</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {lastMonth.map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelect(item)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-surface px-3 py-1.5 text-sm text-ink-muted hover:border-hairline-strong hover:bg-canvas"
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
