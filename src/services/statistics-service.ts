import { transactionRepository } from '@/repositories/transaction-repository';
import { assetRepository } from '@/repositories/asset-repository';

interface MonthlySummary {
  income: number;
  expense: number;
  balance: number;
}

interface CategorySummary {
  categoryId: string;
  categoryName: string;
  amount: number;
  percentage: number;
}

export const statisticsService = {
  async getMonthlySummary(year: number, month: number): Promise<MonthlySummary> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);
    const transactions = await transactionRepository.findByDateRange(startDate, endDate);

    let income = 0;
    let expense = 0;

    for (const tx of transactions) {
      if (tx.type === 'income') {
        income += tx.amount;
      } else {
        expense += tx.amount;
      }
    }

    return {
      income,
      expense,
      balance: income - expense,
    };
  },

  async getYearlySummary(year: number): Promise<MonthlySummary[]> {
    const summaries: MonthlySummary[] = [];

    for (let month = 1; month <= 12; month++) {
      const summary = await this.getMonthlySummary(year, month);
      summaries.push(summary);
    }

    return summaries;
  },

  async getCategoryBreakdown(
    year: number,
    month: number,
    type: 'income' | 'expense'
  ): Promise<CategorySummary[]> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);
    const transactions = await transactionRepository.findByDateRange(startDate, endDate);

    const filtered = transactions.filter(tx => tx.type === type);
    const total = filtered.reduce((sum, tx) => sum + tx.amount, 0);

    const categoryMap = new Map<string, { name: string; amount: number }>();

    for (const tx of filtered) {
      const existing = categoryMap.get(tx.categoryId);
      const category = tx as unknown as { category: { name: string } };
      if (existing) {
        existing.amount += tx.amount;
      } else {
        categoryMap.set(tx.categoryId, {
          name: category.category?.name ?? 'Unknown',
          amount: tx.amount,
        });
      }
    }

    return Array.from(categoryMap.entries())
      .map(([categoryId, { name, amount }]) => ({
        categoryId,
        categoryName: name,
        amount,
        percentage: total > 0 ? (amount / total) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  },

  async getTotalAssets(): Promise<number> {
    return assetRepository.getTotalBalance();
  },
};
