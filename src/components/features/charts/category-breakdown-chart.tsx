'use client';

import { useState } from 'react';
import { ResponsivePie } from '@nivo/pie';
import { Card } from '@/components/ui/card';
import { formatAmount } from '@/lib/format-utils';
import type { HierarchicalCategoryExpense } from '@/types';

type CategoryType = 'income' | 'expense';

type CategoryChartData = HierarchicalCategoryExpense;

interface ClickedItem {
  id: string;
  label: string;
  isParent: boolean;
  parentId?: string;
  parentLabel?: string;
}

interface CategoryBreakdownChartProps {
  dataByType: Record<CategoryType, CategoryChartData[]>;
  value?: CategoryType;
  defaultValue?: CategoryType;
  onValueChange?: (value: CategoryType) => void;
  typeOptions?: Array<{ value: CategoryType; label: string }>;
  onItemClick?: (item: ClickedItem) => void;
  selectedItemId?: string;
}

const categoryColorPalettes: Record<CategoryType, string[]> = {
  expense: [
    '#ef4444',
    '#f97316',
    '#eab308',
    '#84cc16',
    '#06b6d4',
    '#8b5cf6',
    '#ec4899',
    '#3b82f6',
    '#6b7280',
  ],
  income: ['#22c55e', '#16a34a', '#14b8a6', '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6'],
};

// 소분류 색상 (대분류 색상보다 밝게)
function getChildColor(parentColor: string, index: number): string {
  const lightness = 0.15 + index * 0.08;
  return adjustColorLightness(parentColor, lightness);
}

function adjustColorLightness(hex: string, amount: number): string {
  const num = parseInt(hex.slice(1), 16);
  const r = Math.min(255, Math.round((num >> 16) + (255 - (num >> 16)) * amount));
  const g = Math.min(
    255,
    Math.round(((num >> 8) & 0x00ff) + (255 - ((num >> 8) & 0x00ff)) * amount)
  );
  const b = Math.min(255, Math.round((num & 0x0000ff) + (255 - (num & 0x0000ff)) * amount));
  return `#${(0x1000000 + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function buildCategoryColorMap(items: CategoryChartData[], palette: string[]) {
  const colorMap = new Map<string, string>();
  let paletteIndex = 0;

  for (const item of items) {
    if (item.color) {
      colorMap.set(item.id, item.color);
      continue;
    }

    const fallback = palette[paletteIndex % palette.length] ?? '#71717a';
    colorMap.set(item.id, fallback);
    paletteIndex += 1;
  }

  return colorMap;
}

const defaultTypeOptions: Array<{ value: CategoryType; label: string }> = [
  { value: 'expense', label: '지출' },
  { value: 'income', label: '수입' },
];

export function CategoryBreakdownChart({
  dataByType,
  value,
  defaultValue = 'expense',
  onValueChange,
  typeOptions = defaultTypeOptions,
  onItemClick,
  selectedItemId,
}: CategoryBreakdownChartProps) {
  const [internalValue, setInternalValue] = useState<CategoryType>(defaultValue);
  const currentValue = value ?? internalValue;
  const data = (dataByType[currentValue] ?? []).filter(item => item.value > 0);
  const currentLabel =
    typeOptions.find(option => option.value === currentValue)?.label ??
    (currentValue === 'expense' ? '지출' : '수입');

  const parentColorMap = buildCategoryColorMap(data, categoryColorPalettes[currentValue]);
  const totalValue = data.reduce((sum, item) => sum + item.value, 0);

  const childData: {
    id: string;
    label: string;
    value: number;
    color: string;
    parentId: string;
    parentLabel: string;
  }[] = [];
  data.forEach(parent => {
    const parentColor = parentColorMap.get(parent.id) ?? '#71717a';
    const children = (parent.children ?? []).filter(child => child.value > 0);
    if (children.length > 0) {
      children.forEach((child, index) => {
        childData.push({
          id: child.id,
          label: child.label,
          value: child.value,
          color: child.color ?? getChildColor(parentColor, index),
          parentId: parent.id,
          parentLabel: parent.label,
        });
      });
    } else {
      childData.push({
        id: parent.id,
        label: parent.label,
        value: parent.value,
        color: parentColor,
        parentId: parent.id,
        parentLabel: parent.label,
      });
    }
  });

  return (
    <Card className="flex h-full min-h-[360px] flex-col border border-zinc-100 shadow-sm dark:border-zinc-700">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">
          카테고리별 {currentLabel}
        </h3>
        <div className="flex rounded-lg bg-zinc-100 p-1 text-sm font-medium text-zinc-600 dark:bg-zinc-900 dark:text-zinc-200">
          {typeOptions.map(option => {
            const isActive = option.value === currentValue;
            return (
              <button
                key={option.value}
                type="button"
                className={`rounded-md px-3 py-1.5 transition ${
                  isActive
                    ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-white'
                    : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-300 dark:hover:text-white'
                }`}
                onClick={() => {
                  if (!value) setInternalValue(option.value);
                  onValueChange?.(option.value);
                }}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      {data.length === 0 || childData.length === 0 ? (
        <div className="flex min-h-[280px] flex-1 items-center justify-center rounded-lg border border-dashed border-zinc-200 bg-zinc-50/70 px-4 text-center dark:border-zinc-700 dark:bg-zinc-900/40">
          <div>
            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
              표시할 {currentLabel} 카테고리가 없습니다.
            </p>
            <p className="mt-1 text-sm text-zinc-400 dark:text-zinc-500">
              거래가 생기면 카테고리 비중이 표시됩니다.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid flex-1 gap-5 lg:grid-cols-[minmax(220px,0.9fr)_minmax(0,1.1fr)]">
          <div className="relative min-h-[260px]">
            <ResponsivePie
              data={childData}
              margin={{ top: 8, right: 8, bottom: 8, left: 8 }}
              innerRadius={0.62}
              padAngle={0.7}
              cornerRadius={3}
              activeOuterRadiusOffset={6}
              colors={d => d.data.color}
              borderWidth={1}
              borderColor="#ffffff"
              enableArcLinkLabels={false}
              enableArcLabels={false}
              onClick={datum => {
                onItemClick?.({
                  id: datum.id as string,
                  label: datum.label as string,
                  isParent: false,
                  parentId: datum.data.parentId,
                  parentLabel: datum.data.parentLabel,
                });
              }}
              tooltip={({ datum }) => (
                <div className="rounded-md bg-white px-3 py-2 shadow-lg dark:bg-zinc-800">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: datum.color }}
                    />
                    <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                      {datum.data.parentLabel !== datum.label
                        ? `${datum.data.parentLabel} > ${datum.label}`
                        : datum.label}
                    </span>
                  </div>
                  <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                    {formatAmount(datum.value)}
                  </div>
                </div>
              )}
            />
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="max-w-32 text-center">
                <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500">합계</p>
                <p className="mt-1 break-words text-sm font-semibold text-zinc-700 [overflow-wrap:anywhere] dark:text-zinc-200">
                  {formatAmount(totalValue)}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            {data.map(item => {
              const itemColor = parentColorMap.get(item.id) ?? '#71717a';
              const ratio = totalValue > 0 ? Math.round((item.value / totalValue) * 100) : 0;
              const children = (item.children ?? []).filter(child => child.value > 0);
              const isSelected =
                selectedItemId === item.id || children.some(child => child.id === selectedItemId);

              return (
                <div key={item.id}>
                  <button
                    type="button"
                    className={`w-full rounded-lg border px-3 py-2.5 text-left transition ${
                      isSelected
                        ? 'border-zinc-400 bg-zinc-50 dark:border-zinc-500 dark:bg-zinc-900/60'
                        : 'border-zinc-100 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:border-zinc-600 dark:hover:bg-zinc-900/40'
                    }`}
                    onClick={() =>
                      onItemClick?.({
                        id: item.id,
                        label: item.label,
                        isParent: true,
                      })
                    }
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: itemColor }}
                          />
                          <span className="truncate text-sm font-medium text-zinc-700 dark:text-zinc-200">
                            {item.label}
                          </span>
                        </div>
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-700">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${ratio}%`, backgroundColor: itemColor }}
                          />
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                          {formatAmount(item.value)}
                        </p>
                        <p className="text-xs text-zinc-400 dark:text-zinc-500">{ratio}%</p>
                      </div>
                    </div>
                  </button>

                  {isSelected && children.length > 0 && (
                    <div className="mt-1.5 grid gap-1 pl-4">
                      {children.map((child, index) => {
                        const childColor = child.color ?? getChildColor(itemColor, index);
                        const isChildSelected = selectedItemId === child.id;
                        return (
                          <button
                            key={child.id}
                            type="button"
                            className={`flex min-w-0 items-center justify-between gap-3 rounded-md px-3 py-1.5 text-left text-xs transition ${
                              isChildSelected
                                ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-700 dark:text-white'
                                : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200'
                            }`}
                            onClick={() =>
                              onItemClick?.({
                                id: child.id,
                                label: child.label,
                                isParent: false,
                                parentId: item.id,
                                parentLabel: item.label,
                              })
                            }
                          >
                            <span className="flex min-w-0 items-center gap-2">
                              <span
                                className="h-2 w-2 shrink-0 rounded-full"
                                style={{ backgroundColor: childColor }}
                              />
                              <span className="truncate">{child.label}</span>
                            </span>
                            <span className="shrink-0 font-medium">
                              {formatAmount(child.value)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
}
