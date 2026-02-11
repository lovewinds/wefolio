'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { fetchDashboardData } from '@/lib/mock-data';
import type { TransactionType, CategoryGroup } from '@/types';
import type { RecommendationItem } from '@/components/features/transaction-input/types';

interface TemplateData {
  id: string;
  name: string;
  type: string;
  amount: number;
  description?: string | null;
  categoryId: string;
  category?: { id: string; name: string; icon?: string | null } | null;
}

export function useRecommendations(
  year: number,
  month: number,
  type: TransactionType,
  categories: CategoryGroup[]
) {
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const getCategoryName = useCallback(
    (categoryId: string): string => {
      for (const group of categories) {
        if (group.id === categoryId) return group.name;
        for (const child of group.children ?? []) {
          if (child.id === categoryId) return child.name;
        }
      }
      return '';
    },
    [categories]
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      const items: RecommendationItem[] = [];

      // 1. Fetch last month's transactions
      try {
        const prevMonth = month === 1 ? 12 : month - 1;
        const prevYear = month === 1 ? year - 1 : year;
        const data = await fetchDashboardData(prevYear, prevMonth);

        if (!cancelled) {
          const seen = new Set<string>();
          for (const tx of data.transactions) {
            if (tx.type !== type) continue;
            // Dedup key: category + paymentMethod + amount
            const key = `${tx.category}|${tx.paymentMethod ?? ''}|${tx.amount}`;
            if (seen.has(key)) continue;
            seen.add(key);

            // Find category ID from category name
            let categoryId = '';
            for (const group of categories) {
              if (group.name === tx.category) {
                categoryId = group.id;
                break;
              }
              for (const child of group.children ?? []) {
                if (child.name === tx.category) {
                  categoryId = child.id;
                  break;
                }
              }
              if (categoryId) break;
            }

            if (!categoryId) continue;

            items.push({
              id: `last-${tx.id}`,
              source: 'lastMonth',
              label: `${tx.category} ${tx.amount.toLocaleString()}원`,
              categoryId,
              categoryName: tx.category,
              paymentMethod: tx.paymentMethod ?? undefined,
              amount: tx.amount,
              description: tx.description ?? undefined,
            });
          }
        }
      } catch {
        // Silently ignore - recommendations are non-critical
      }

      // 2. Fetch templates
      try {
        const templates = await apiClient.templates.getAll<TemplateData[]>(type);
        if (!cancelled) {
          for (const t of templates) {
            items.push({
              id: `tmpl-${t.id}`,
              source: 'template',
              label: t.name,
              categoryId: t.categoryId,
              categoryName: t.category?.name ?? getCategoryName(t.categoryId),
              amount: t.amount,
              description: t.description ?? undefined,
            });
          }
        }
      } catch {
        // Silently ignore
      }

      if (!cancelled) {
        setRecommendations(items);
        setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [year, month, type, categories, getCategoryName]);

  return { recommendations, isLoading };
}
