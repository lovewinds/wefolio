'use client';

import { useEffect, useState } from 'react';
import { ListChecks } from 'lucide-react';
import { Card, EmptyState, Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui';
import { apiClient } from '@/lib/api-client';
import { formatAmount, formatExchangeRate, formatForeignAmount } from '@/lib/format-utils';
import { formatMonthDisplay } from '@/lib/year-month-utils';
import { RISK_LEVEL_TEXT_COLORS } from '@/lib/constants';
import type { AssetRecordRow, BudgetRecordRow, RecordMonth } from '@/types';

type DomainKey = 'budget' | 'asset';

interface DataRecordsViewProps {
  reloadSignal: number;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
}

export function DataRecordsView({ reloadSignal }: DataRecordsViewProps) {
  return (
    <Card>
      <div className="mb-1 flex items-center gap-2">
        <ListChecks size={18} className="text-accent" />
        <h3 className="text-base font-semibold text-ink">데이터 확인</h3>
      </div>
      <p className="mb-5 text-sm text-ink-subtle">로드된 데이터를 도메인·월별로 확인합니다.</p>

      <Tabs defaultValue="budget">
        <TabsList className="mb-4">
          <TabsTrigger value="budget">가계부</TabsTrigger>
          <TabsTrigger value="asset">자산</TabsTrigger>
        </TabsList>
        <TabsContent value="budget">
          <DomainRecords domain="budget" reloadSignal={reloadSignal} />
        </TabsContent>
        <TabsContent value="asset">
          <DomainRecords domain="asset" reloadSignal={reloadSignal} />
        </TabsContent>
      </Tabs>
    </Card>
  );
}

function DomainRecords({ domain, reloadSignal }: { domain: DomainKey; reloadSignal: number }) {
  const [months, setMonths] = useState<RecordMonth[] | null>(null);
  const [selected, setSelected] = useState<RecordMonth | null>(null);
  const [loaded, setLoaded] = useState<{
    key: string;
    rows: BudgetRecordRow[] | AssetRecordRow[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 월 목록 로드(+최신월 자동 선택). 로드/삭제 시 reloadSignal 변화로 재조회.
  useEffect(() => {
    let cancelled = false;
    apiClient.settingsData
      .getRecordMonths(domain)
      .then(result => {
        if (cancelled) return;
        setMonths(result);
        setSelected(prev =>
          prev && result.some(m => m.year === prev.year && m.month === prev.month)
            ? prev
            : (result[0] ?? null)
        );
        setError(null);
      })
      .catch(e => {
        if (!cancelled) setError(errorMessage(e));
      });
    return () => {
      cancelled = true;
    };
  }, [domain, reloadSignal]);

  // 선택 월의 행 로드(reloadSignal 변화 시 현재 월도 재조회).
  useEffect(() => {
    if (!selected) return;
    let cancelled = false;
    const key = `${selected.year}-${selected.month}`;
    const fetcher =
      domain === 'budget'
        ? apiClient.settingsData.getBudgetRecords(selected.year, selected.month)
        : apiClient.settingsData.getAssetRecords(selected.year, selected.month);
    fetcher
      .then(result => {
        if (!cancelled) setLoaded({ key, rows: result });
      })
      .catch(e => {
        if (!cancelled) setError(errorMessage(e));
      });
    return () => {
      cancelled = true;
    };
  }, [domain, selected, reloadSignal]);

  if (error) return <p className="text-sm text-loss">불러오기 실패: {error}</p>;
  if (!months) return <p className="text-sm text-ink-subtle">불러오는 중…</p>;
  if (months.length === 0) {
    return (
      <EmptyState
        title="로드된 데이터가 없습니다."
        description="상단에서 xlsx를 로드하면 여기에 표시됩니다."
      />
    );
  }

  const selectedKey = selected ? `${selected.year}-${selected.month}` : null;
  const rowsReady = loaded !== null && loaded.key === selectedKey;

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        {months.map(month => {
          const isActive = selected?.year === month.year && selected?.month === month.month;
          return (
            <button
              key={`${month.year}-${month.month}`}
              type="button"
              onClick={() => setSelected(month)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                isActive
                  ? 'bg-accent text-on-accent'
                  : 'bg-surface-soft text-ink-muted hover:text-ink'
              }`}
            >
              {month.year}.{String(month.month).padStart(2, '0')}
              <span className="ml-1 opacity-70">{month.count}</span>
            </button>
          );
        })}
      </div>

      {selected && (
        <>
          <p className="mb-2 text-sm font-semibold text-ink">
            {formatMonthDisplay(selected.year, selected.month)} · {selected.count}건
          </p>
          {!rowsReady ? (
            <p className="text-sm text-ink-subtle">불러오는 중…</p>
          ) : domain === 'budget' ? (
            <BudgetTable rows={loaded.rows as BudgetRecordRow[]} />
          ) : (
            <AssetTable rows={loaded.rows as AssetRecordRow[]} />
          )}
        </>
      )}
    </div>
  );
}

const TH = 'px-3 py-2 font-semibold whitespace-nowrap';
const TD = 'px-3 py-2 whitespace-nowrap text-ink-muted';

function BudgetTable({ rows }: { rows: BudgetRecordRow[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-hairline">
      <table className="w-full min-w-[680px] text-left text-sm">
        <thead className="bg-surface-soft text-xs uppercase tracking-wide text-ink-subtle">
          <tr>
            <th className={TH}>날짜</th>
            <th className={TH}>유형</th>
            <th className={TH}>분류</th>
            <th className={`${TH} text-right`}>금액</th>
            <th className={TH}>결제수단</th>
            <th className={TH}>사용자</th>
            <th className={`${TH} w-full`}>메모</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr key={row.id} className="border-t border-hairline hover:bg-surface-soft">
              <td className={TD}>{row.date}</td>
              <td className="px-3 py-2 whitespace-nowrap">
                <span className={row.type === 'income' ? 'text-gain' : 'text-loss'}>
                  {row.type === 'income' ? '수입' : '지출'}
                </span>
              </td>
              <td className={TD}>
                {row.parentCategory ? `${row.parentCategory} > ${row.category}` : row.category}
              </td>
              <td
                className={`px-3 py-2 text-right font-semibold whitespace-nowrap ${
                  row.type === 'income' ? 'text-gain' : 'text-loss'
                }`}
              >
                {row.type === 'income' ? '+' : '-'}
                {formatAmount(row.amount)}
              </td>
              <td className={TD}>{row.paymentMethod ?? '-'}</td>
              <td className={TD}>{row.user ?? '-'}</td>
              <td className="px-3 py-2 text-ink-muted">{row.description ?? '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AssetTable({ rows }: { rows: AssetRecordRow[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-hairline">
      <table className="w-full min-w-[860px] text-left text-sm">
        <thead className="bg-surface-soft text-xs uppercase tracking-wide text-ink-subtle">
          <tr>
            <th className={TH}>일자</th>
            <th className={TH}>구성원</th>
            <th className={TH}>기관</th>
            <th className={TH}>계좌</th>
            <th className={TH}>종목</th>
            <th className={`${TH} text-right`}>수량</th>
            <th className={`${TH} text-right`}>현재가(원)</th>
            <th className={`${TH} text-right`}>평가액</th>
            <th className={TH}>통화/환율</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr key={row.id} className="border-t border-hairline hover:bg-surface-soft">
              <td className={TD}>{row.date}</td>
              <td className={TD}>{row.member}</td>
              <td className={TD}>{row.institution}</td>
              <td className={TD}>{row.account}</td>
              <td className="px-3 py-2 whitespace-nowrap">
                <span className="font-medium text-ink">{row.assetName}</span>
                {row.riskLevel && (
                  <span
                    className={`ml-1 text-xs font-semibold ${
                      RISK_LEVEL_TEXT_COLORS[row.riskLevel] ?? 'text-ink-subtle'
                    }`}
                  >
                    {row.riskLevel}
                  </span>
                )}
              </td>
              <td className={`${TD} text-right`}>{row.quantity.toLocaleString('ko-KR')}</td>
              <td className={`${TD} text-right`}>{formatAmount(row.currentPriceKRW)}</td>
              <td className="px-3 py-2 text-right font-semibold whitespace-nowrap text-ink">
                {formatAmount(row.valueKRW)}
              </td>
              <td className={TD}>
                {row.currency === 'KRW'
                  ? 'KRW'
                  : `${row.currency}/KRW${row.exchangeRate ? ` ${formatExchangeRate(row.exchangeRate, row.currency)}` : ''}${
                      row.priceOriginal != null
                        ? ` · ${formatForeignAmount(row.priceOriginal, row.currency)}`
                        : ''
                    }`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
