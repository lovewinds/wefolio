'use client';

import { useMemo, useRef, useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { formatAmount, type DashboardTransaction } from '@/lib/mock-data';

type TransactionTypeFilter = 'all' | 'income' | 'expense';
type SortOrder = 'none' | 'asc' | 'desc';

interface FilterDropdownOption {
  value: string;
  label: string;
}

interface FilterDropdownProps {
  value: string;
  options: FilterDropdownOption[];
  onChange: (value: string) => void;
}

function FilterDropdown({ value, options, onChange }: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedLabel = options.find(opt => opt.value === value)?.label ?? '';

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg border-0 bg-gradient-to-b from-zinc-50 to-zinc-100 px-4 py-1.5 text-sm font-medium text-zinc-700 shadow-sm outline-none transition-all hover:from-zinc-100 hover:to-zinc-200 dark:from-zinc-800 dark:to-zinc-900 dark:text-zinc-300 dark:hover:from-zinc-700 dark:hover:to-zinc-800"
      >
        {selectedLabel}
        <svg
          className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 z-10 mt-1 min-w-full overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
          {options.map(option => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`w-full whitespace-nowrap px-4 py-2 text-left text-sm transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-700 ${
                value === option.value
                  ? 'bg-zinc-100 font-medium text-zinc-900 dark:bg-zinc-700 dark:text-zinc-100'
                  : 'text-zinc-600 dark:text-zinc-300'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface RecentTransactionsProps {
  transactions: DashboardTransaction[];
  limit?: number;
}

export function RecentTransactions({ transactions, limit = 5 }: RecentTransactionsProps) {
  const [typeFilter, setTypeFilter] = useState<TransactionTypeFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<SortOrder>('none');

  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(transactions.map(t => t.category))];
    return uniqueCategories.sort();
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    let result = [...transactions];

    if (typeFilter !== 'all') {
      result = result.filter(t => t.type === typeFilter);
    }

    if (categoryFilter !== 'all') {
      result = result.filter(t => t.category === categoryFilter);
    }

    if (sortOrder === 'asc') {
      result.sort((a, b) => a.amount - b.amount);
    } else if (sortOrder === 'desc') {
      result.sort((a, b) => b.amount - a.amount);
    }

    return result.slice(0, limit);
  }, [transactions, typeFilter, categoryFilter, sortOrder, limit]);

  return (
    <Card className="mt-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">최근 거래 내역</h3>

        <div className="flex flex-wrap gap-2">
          <FilterDropdown
            value={typeFilter}
            onChange={v => setTypeFilter(v as TransactionTypeFilter)}
            options={[
              { value: 'all', label: '전체' },
              { value: 'income', label: '수입' },
              { value: 'expense', label: '지출' },
            ]}
          />

          <FilterDropdown
            value={categoryFilter}
            onChange={setCategoryFilter}
            options={[
              { value: 'all', label: '전체 카테고리' },
              ...categories.map(category => ({ value: category, label: category })),
            ]}
          />

          <FilterDropdown
            value={sortOrder}
            onChange={v => setSortOrder(v as SortOrder)}
            options={[
              { value: 'none', label: '정렬 없음' },
              { value: 'asc', label: '금액 오름차순' },
              { value: 'desc', label: '금액 내림차순' },
            ]}
          />
        </div>
      </div>

      <div className="space-y-3">
        {filteredTransactions.length === 0 ? (
          <p className="py-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
            조건에 맞는 거래 내역이 없습니다.
          </p>
        ) : (
          filteredTransactions.map(transaction => (
            <div
              key={transaction.id}
              className="flex items-center justify-between border-b border-zinc-100 pb-3 last:border-0 dark:border-zinc-700"
            >
              <div className="flex items-center gap-3">
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium ${
                    transaction.type === 'income'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300'
                      : 'bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300'
                  }`}
                >
                  {transaction.category.charAt(0)}
                </span>
                <div>
                  <p className="font-medium text-zinc-800 dark:text-zinc-100">
                    {transaction.category}
                  </p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">{transaction.date}</p>
                </div>
              </div>
              <p
                className={`font-semibold ${
                  transaction.type === 'income'
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {transaction.type === 'income' ? '+' : '-'}
                {formatAmount(transaction.amount)}
              </p>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
