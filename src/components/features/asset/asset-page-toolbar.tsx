'use client';

import { MonthSelector } from '@/components/features/navigation';
import { AssetSubNav } from './asset-sub-nav';

interface AssetPageToolbarProps {
  year: number;
  month: number;
  titleSuffix: string;
  canPrev?: boolean;
  canNext?: boolean;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onYearChange: (year: number) => void;
  onMonthChange: (month: number) => void;
}

export function AssetPageToolbar({
  year,
  month,
  titleSuffix,
  canPrev = true,
  canNext = true,
  onPrevMonth,
  onNextMonth,
  onYearChange,
  onMonthChange,
}: AssetPageToolbarProps) {
  return (
    <section className="mb-8">
      <MonthSelector
        year={year}
        month={month}
        titleSuffix={titleSuffix}
        canPrev={canPrev}
        canNext={canNext}
        onPrevMonth={onPrevMonth}
        onNextMonth={onNextMonth}
        onYearChange={onYearChange}
        onMonthChange={onMonthChange}
        actions={<AssetSubNav year={year} month={month} />}
      />
    </section>
  );
}
