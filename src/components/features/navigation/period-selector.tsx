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
      <span className="text-sm font-medium text-ink-subtle">기간</span>
      <div className="toggle">
        {PRESETS.map(preset => {
          const isActive = selectedMonths === preset.months;
          return (
            <button
              key={preset.months}
              type="button"
              onClick={() => onSelect(preset.months)}
              className={isActive ? 'on' : ''}
            >
              {preset.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
