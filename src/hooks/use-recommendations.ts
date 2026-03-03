'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { fetchDashboardData } from '@/lib/mock-data';
import type { TransactionType, CategoryGroup } from '@/types';
import type { DashboardTransaction } from '@/types/dashboard';
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
  categories: CategoryGroup[],
  descriptionQuery: string
) {
  const [allTransactions, setAllTransactions] = useState<DashboardTransaction[]>([]);
  const [allTemplates, setAllTemplates] = useState<TemplateData[]>([]);
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

  const getCategoryIdByName = useCallback(
    (name: string): string => {
      for (const group of categories) {
        if (group.name === name) return group.id;
        for (const child of group.children ?? []) {
          if (child.name === name) return child.id;
        }
      }
      return '';
    },
    [categories]
  );

  // Fetch raw data (transactions from last 3 months + templates)
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      // Build list of last 3 months to fetch
      const monthsToFetch: { year: number; month: number }[] = [];
      for (let i = 1; i <= 3; i++) {
        let m = month - i;
        let y = year;
        if (m <= 0) {
          m += 12;
          y -= 1;
        }
        monthsToFetch.push({ year: y, month: m });
      }

      // Fetch transactions for each month in parallel
      try {
        const results = await Promise.all(
          monthsToFetch.map(({ year: y, month: m }) => fetchDashboardData(y, m))
        );
        if (!cancelled) {
          const txns = results.flatMap(d => d.transactions).filter(tx => tx.type === type);
          setAllTransactions(txns);
        }
      } catch {
        // silently ignore
      }

      // Fetch templates
      try {
        const templates = await apiClient.templates.getAll<TemplateData[]>(type);
        if (!cancelled) {
          setAllTemplates(templates);
        }
      } catch {
        // silently ignore
      }

      if (!cancelled) setIsLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [year, month, type]);

  // Compute recommendations based on descriptionQuery
  const recommendations = useMemo((): RecommendationItem[] => {
    const query = descriptionQuery.trim().toLowerCase();

    // Build template recommendation items
    const templateItems: RecommendationItem[] = allTemplates.slice(0, 5).map(t => ({
      id: `tmpl-${t.id}`,
      source: 'template' as const,
      label: t.name,
      categoryId: t.categoryId,
      categoryName: t.category?.name ?? getCategoryName(t.categoryId),
      amount: t.amount,
      description: t.description ?? undefined,
    }));

    // When query is too short, return templates only
    if (query.length < 2) {
      return templateItems;
    }

    // Group past transactions by description, filtered by query
    const grouped = new Map<
      string,
      {
        description: string;
        count: number;
        categoryId: string;
        categoryName: string;
        paymentMethod?: string;
        amount: number;
        lastDate: string;
      }
    >();

    for (const tx of allTransactions) {
      if (!tx.description) continue;
      if (!tx.description.toLowerCase().includes(query)) continue;

      const key = tx.description.toLowerCase();
      const existing = grouped.get(key);
      if (existing) {
        existing.count++;
        // Keep data from most recent occurrence
        if (tx.date > existing.lastDate) {
          existing.lastDate = tx.date;
          const catId = getCategoryIdByName(tx.category);
          if (catId) {
            existing.categoryId = catId;
            existing.categoryName = tx.category;
          }
          if (tx.paymentMethod) existing.paymentMethod = tx.paymentMethod;
          existing.amount = tx.amount;
        }
      } else {
        const catId = getCategoryIdByName(tx.category);
        if (!catId) continue;
        grouped.set(key, {
          description: tx.description,
          count: 1,
          categoryId: catId,
          categoryName: tx.category,
          paymentMethod: tx.paymentMethod ?? undefined,
          amount: tx.amount,
          lastDate: tx.date,
        });
      }
    }

    const memoItems: RecommendationItem[] = [...grouped.values()]
      .sort((a, b) => b.count - a.count || b.lastDate.localeCompare(a.lastDate))
      .slice(0, 5)
      .map(entry => ({
        id: `desc-${entry.description}`,
        source: 'lastMonth' as const,
        label: entry.description,
        categoryId: entry.categoryId,
        categoryName: entry.categoryName,
        paymentMethod: entry.paymentMethod,
        amount: entry.amount,
        description: entry.description,
        count: entry.count,
      }));

    // Include matching templates filtered by query
    const matchingTemplates = templateItems.filter(
      t =>
        t.label.toLowerCase().includes(query) ||
        (t.description && t.description.toLowerCase().includes(query))
    );

    return [...memoItems, ...matchingTemplates];
  }, [allTransactions, allTemplates, descriptionQuery, getCategoryName, getCategoryIdByName]);

  return { recommendations, isLoading };
}
