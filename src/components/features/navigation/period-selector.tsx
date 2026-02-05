'use client';

interface PeriodPreset {
  label: string;
  months: number;
}

const PRESETS: PeriodPreset[] = [
  { label: '3개월', months: 3 },
  { label: '6개월', months: 6 },
  { label: '1년', months: 12 },
  { label: '전체', months: 0 },
];

interface PeriodSelectorProps {
  selectedMonths: number;
  onSelect: (months: number) => void;
}

export function PeriodSelector({ selectedMonths, onSelect }: PeriodSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">기간</span>
      <div className="flex rounded-full bg-zinc-100 p-1 dark:bg-zinc-800">
        {PRESETS.map(preset => {
          const isActive = selectedMonths === preset.months;
          return (
            <button
              key={preset.months}
              type="button"
              onClick={() => onSelect(preset.months)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-100'
                  : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
              }`}
            >
              {preset.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
