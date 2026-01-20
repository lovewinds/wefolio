'use client';

import { ResponsivePie } from '@nivo/pie';
import { ResponsiveBar } from '@nivo/bar';
import {
  mockTransactions,
  calculateStats,
  getExpenseByCategory,
  formatAmount,
} from '@/lib/mock-data';

// 통계 계산
const { totalIncome, totalExpense, balance } = calculateStats(mockTransactions);

// 카테고리별 지출 데이터 (Pie Chart용)
const expenseByCategory = getExpenseByCategory(mockTransactions);

// 수입 vs 지출 비교 데이터 (Bar Chart용)
const incomeExpenseData = [
  {
    category: '이번 달',
    수입: totalIncome,
    지출: totalExpense,
  },
];

export default function Home() {
  const currentMonth = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
  });

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <main className="mx-auto max-w-5xl px-4 py-8">
        {/* 헤더 */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">WeFolio</h1>
          <p className="mt-1 text-zinc-600 dark:text-zinc-400">
            가족의 자산 포트폴리오를 완성해 나가는 가계부
          </p>
        </header>

        {/* 이번 달 요약 */}
        <section className="mb-8">
          <h2 className="mb-4 text-xl font-semibold text-zinc-800 dark:text-zinc-100">
            {currentMonth} 요약
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-zinc-800">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">총 수입</p>
              <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {formatAmount(totalIncome)}
              </p>
            </div>
            <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-zinc-800">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">총 지출</p>
              <p className="mt-1 text-2xl font-bold text-rose-600 dark:text-rose-400">
                {formatAmount(totalExpense)}
              </p>
            </div>
            <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-zinc-800">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">잔액</p>
              <p
                className={`mt-1 text-2xl font-bold ${
                  balance >= 0
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {formatAmount(balance)}
              </p>
            </div>
          </div>
        </section>

        {/* 차트 영역 */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* 수입 vs 지출 비교 (Bar Chart) */}
          <section className="rounded-xl bg-white p-6 shadow-sm dark:bg-zinc-800">
            <h3 className="mb-4 text-lg font-semibold text-zinc-800 dark:text-zinc-100">
              수입 vs 지출
            </h3>
            <div className="h-64">
              <ResponsiveBar
                data={incomeExpenseData}
                keys={['수입', '지출']}
                indexBy="category"
                margin={{ top: 20, right: 20, bottom: 40, left: 80 }}
                padding={0.3}
                groupMode="grouped"
                colors={['#10b981', '#f43f5e']}
                borderRadius={4}
                axisBottom={{
                  tickSize: 0,
                  tickPadding: 10,
                }}
                axisLeft={{
                  tickSize: 0,
                  tickPadding: 10,
                  format: v => `${(Number(v) / 10000).toFixed(0)}만`,
                }}
                labelSkipWidth={12}
                labelSkipHeight={12}
                labelTextColor="#ffffff"
                valueFormat={v => formatAmount(v)}
                theme={{
                  axis: {
                    ticks: {
                      text: {
                        fill: '#71717a',
                      },
                    },
                  },
                  grid: {
                    line: {
                      stroke: '#e4e4e7',
                    },
                  },
                }}
                legends={[
                  {
                    dataFrom: 'keys',
                    anchor: 'top-right',
                    direction: 'row',
                    translateY: -20,
                    itemWidth: 60,
                    itemHeight: 20,
                    itemTextColor: '#71717a',
                    symbolSize: 12,
                    symbolShape: 'circle',
                  },
                ]}
              />
            </div>
          </section>

          {/* 카테고리별 지출 (Pie Chart) */}
          <section className="rounded-xl bg-white p-6 shadow-sm dark:bg-zinc-800">
            <h3 className="mb-4 text-lg font-semibold text-zinc-800 dark:text-zinc-100">
              카테고리별 지출
            </h3>
            <div className="h-64">
              <ResponsivePie
                data={expenseByCategory}
                margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                innerRadius={0.5}
                padAngle={0.7}
                cornerRadius={3}
                activeOuterRadiusOffset={8}
                colors={{ scheme: 'paired' }}
                borderWidth={1}
                borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
                arcLinkLabelsSkipAngle={10}
                arcLinkLabelsTextColor="#71717a"
                arcLinkLabelsThickness={2}
                arcLinkLabelsColor={{ from: 'color' }}
                arcLabelsSkipAngle={10}
                arcLabelsTextColor="#ffffff"
                valueFormat={v => formatAmount(v)}
              />
            </div>
          </section>
        </div>

        {/* 최근 거래 내역 */}
        <section className="mt-6 rounded-xl bg-white p-6 shadow-sm dark:bg-zinc-800">
          <h3 className="mb-4 text-lg font-semibold text-zinc-800 dark:text-zinc-100">
            최근 거래 내역
          </h3>
          <div className="space-y-3">
            {mockTransactions.slice(0, 5).map(transaction => (
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
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
