'use client';

import { useState } from 'react';
import { Check, Plus, X } from 'lucide-react';
import { ASSET_CLASS, CURRENCY, RISK_LEVEL } from '@/constants/asset';
import type { AssetMasterOption } from '@/components/features/asset-transaction/types';

const inputClass =
  'h-8 w-full rounded-md border border-hairline bg-surface px-2 text-sm text-ink focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent';

export function AssetMasterPicker({
  assetMasters,
  excludeIds,
  onPick,
  onCreate,
  onCancel,
}: {
  assetMasters: AssetMasterOption[];
  excludeIds: Set<string>;
  onPick: (assetMaster: AssetMasterOption) => void;
  onCreate: (data: {
    name: string;
    assetClass: string;
    currency: string;
    riskLevel: string;
  }) => Promise<AssetMasterOption>;
  onCancel: () => void;
}) {
  const [mode, setMode] = useState<'select' | 'create'>('select');
  const [selectedId, setSelectedId] = useState('');
  const [filter, setFilter] = useState('');
  const [form, setForm] = useState({
    name: '',
    assetClass: ASSET_CLASS[0] as string,
    currency: CURRENCY[0] as string,
    riskLevel: RISK_LEVEL[0] as string,
  });
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const available = assetMasters.filter(
    master =>
      !excludeIds.has(master.id) && master.name.toLowerCase().includes(filter.trim().toLowerCase())
  );

  const handlePick = () => {
    const master = assetMasters.find(item => item.id === selectedId);
    if (master) onPick(master);
  };

  const handleCreate = async () => {
    if (!form.name.trim()) return;
    setIsBusy(true);
    setError(null);
    try {
      const created = await onCreate({
        name: form.name.trim(),
        assetClass: form.assetClass,
        currency: form.currency,
        riskLevel: form.riskLevel,
      });
      onPick(created);
    } catch (err) {
      setError(err instanceof Error ? err.message : '종목 생성에 실패했습니다.');
    } finally {
      setIsBusy(false);
    }
  };

  if (mode === 'create') {
    return (
      <div className="space-y-2 rounded-md border border-hairline bg-surface-soft p-2">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          <input
            aria-label="종목명"
            className={inputClass}
            placeholder="종목명"
            value={form.name}
            onChange={event => setForm(prev => ({ ...prev, name: event.target.value }))}
          />
          <select
            aria-label="자산군"
            className={inputClass}
            value={form.assetClass}
            onChange={event => setForm(prev => ({ ...prev, assetClass: event.target.value }))}
          >
            {ASSET_CLASS.map(value => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
          <select
            aria-label="통화"
            className={inputClass}
            value={form.currency}
            onChange={event => setForm(prev => ({ ...prev, currency: event.target.value }))}
          >
            {CURRENCY.map(value => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
          <select
            aria-label="위험구분"
            className={inputClass}
            value={form.riskLevel}
            onChange={event => setForm(prev => ({ ...prev, riskLevel: event.target.value }))}
          >
            {RISK_LEVEL.map(value => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>
        {error && <p className="text-xs text-loss">{error}</p>}
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={!form.name.trim() || isBusy}
            onClick={handleCreate}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-action px-3 text-sm font-medium text-on-action transition-colors hover:bg-action-press disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Check size={15} />
            만들고 추가
          </button>
          <button
            type="button"
            disabled={isBusy}
            onClick={() => setMode('select')}
            className="text-sm text-ink-subtle hover:text-ink disabled:opacity-50"
          >
            목록으로
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-lg text-ink-subtle hover:bg-surface"
          >
            <X size={15} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2 rounded-md border border-hairline bg-surface-soft p-2">
      <div className="flex flex-wrap items-center gap-2">
        <input
          aria-label="종목 검색"
          className={`${inputClass} max-w-[180px]`}
          placeholder="종목 검색"
          value={filter}
          onChange={event => {
            setFilter(event.target.value);
            setSelectedId('');
          }}
        />
        <select
          aria-label="종목 선택"
          className={`${inputClass} max-w-[220px]`}
          value={selectedId}
          onChange={event => setSelectedId(event.target.value)}
        >
          <option value="">종목 선택</option>
          {available.map(master => (
            <option key={master.id} value={master.id}>
              {master.name} ({master.currency})
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={!selectedId}
          onClick={handlePick}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-action px-3 text-sm font-medium text-on-action transition-colors hover:bg-action-press disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus size={15} />
          추가
        </button>
        <button
          type="button"
          onClick={() => setMode('create')}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-hairline bg-surface px-3 text-sm font-medium text-ink-muted hover:bg-canvas"
        >
          + 새 종목
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-lg text-ink-subtle hover:bg-surface"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
}
