'use client';

import { Fragment, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronRight,
  Download,
  Layers,
  Loader2,
  Plus,
  Save,
  Trash2,
  Upload,
  Users,
  X,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { formatAmount } from '@/lib/format-utils';
import type {
  AssetMonthlyInputDraft,
  AssetMonthlyInputRow,
  AssetMonthlyInputSaveRow,
  AssetMonthlyInputStatus,
  AssetMonthlyInputType,
} from '@/types';
import type {
  AccountOption,
  AssetMasterOption,
  InstitutionOption,
} from '@/components/features/asset-transaction/types';

interface MonthlyAssetInputPanelProps {
  open: boolean;
  year: number;
  month: number;
  onClose: () => void;
  onSaved: () => void;
}

interface EditableMonthlyRow extends Omit<
  AssetMonthlyInputRow,
  | 'holdingId'
  | 'quantity'
  | 'priceOriginal'
  | 'exchangeRate'
  | 'priceKRW'
  | 'totalValueKRW'
  | 'status'
> {
  rowKey: string;
  holdingId: string | null;
  quantityInput: string;
  priceOriginalInput: string;
  exchangeRateInput: string;
  priceKRWInput: string;
  totalValueInput: string;
  isExpanded: boolean;
  isNew: boolean;
}

interface NewHoldingSelection {
  accountId: string;
  assetMasterId: string;
}

type GroupMode = 'member' | 'assetClass';

interface MonthlyInputGroup {
  key: string;
  label: string;
  rows: EditableMonthlyRow[];
  totalValue: number;
  missingCount: number;
  filledCount: number;
}

interface LocalMonthlyInputDraft {
  version: 1;
  year: number;
  month: number;
  savedAt: string;
  rows: EditableMonthlyRow[];
}

const numberInputClass =
  'h-8 w-full rounded-md border border-zinc-200 bg-white px-2 text-right text-sm text-zinc-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-blue-400 dark:focus:ring-blue-400';

const selectClass =
  'h-8 w-full rounded-md border border-zinc-200 bg-white px-2 text-sm text-zinc-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-blue-400 dark:focus:ring-blue-400';

const statusStyles: Record<AssetMonthlyInputStatus, string> = {
  유지: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300',
  증가: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  감소: 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
  신규: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  정리됨: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
};

function toEditableRow(row: AssetMonthlyInputRow): EditableMonthlyRow {
  const missing = row.isCurrentMissing;
  return {
    ...row,
    rowKey: row.holdingId,
    holdingId: row.holdingId,
    quantityInput: missing ? '' : String(row.quantity),
    priceOriginalInput: missing ? '' : String(row.priceOriginal),
    exchangeRateInput: missing || row.exchangeRate === null ? '' : String(row.exchangeRate),
    priceKRWInput: missing ? '' : String(row.priceKRW),
    totalValueInput: missing ? '' : String(row.totalValueKRW),
    isExpanded: row.inputType === 'quantity',
    isNew: false,
  };
}

function parseNumberInput(value: string): number | null {
  if (value.trim() === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatDelta(delta: number | null): string {
  if (delta === null) return '-';
  const sign = delta > 0 ? '+' : '';
  return `${sign}${formatAmount(delta)}`;
}

function getStatus(prevTotalValue: number | null, currentTotalValue: number | null) {
  if (currentTotalValue === null) return null;
  const prevValue = prevTotalValue ?? 0;
  if (prevValue <= 0 && currentTotalValue > 0) return '신규' satisfies AssetMonthlyInputStatus;
  if (prevValue > 0 && currentTotalValue === 0) return '정리됨' satisfies AssetMonthlyInputStatus;
  if (currentTotalValue > prevValue) return '증가' satisfies AssetMonthlyInputStatus;
  if (currentTotalValue < prevValue) return '감소' satisfies AssetMonthlyInputStatus;
  return '유지' satisfies AssetMonthlyInputStatus;
}

function getInputType(assetClass: string, accountType: string): AssetMonthlyInputType {
  const lowerAssetClass = assetClass.toLowerCase();
  const lowerAccountType = accountType.toLowerCase();
  const valueOnlyTokens = ['deposit', 'savings', 'time_deposit', 'cma', 'cash'];

  if (
    assetClass.includes('예금') ||
    assetClass.includes('현금') ||
    accountType.includes('예금') ||
    accountType.includes('적금') ||
    accountType.toUpperCase().includes('CMA')
  ) {
    return 'value';
  }

  return valueOnlyTokens.some(
    token => lowerAssetClass.includes(token) || lowerAccountType === token
  )
    ? 'value'
    : 'quantity';
}

function focusNextMonthlyInput(currentTarget: HTMLElement) {
  const inputs = Array.from(
    document.querySelectorAll<HTMLElement>('[data-monthly-input="true"]')
  ).filter(input => !input.hasAttribute('disabled'));
  const index = inputs.indexOf(currentTarget);
  inputs[index + 1]?.focus();
}

function handleMonthlyInputKeyDown(
  event: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>
) {
  if (event.key !== 'Enter') return;
  event.preventDefault();
  focusNextMonthlyInput(event.currentTarget);
}

function buildPayloadRow(row: EditableMonthlyRow): AssetMonthlyInputSaveRow | null {
  const totalValueKRW = parseNumberInput(row.totalValueInput);
  if (totalValueKRW === null || totalValueKRW < 0) return null;

  if (row.inputType === 'value') {
    return {
      holdingId: row.holdingId,
      accountId: row.accountId,
      assetMasterId: row.assetMasterId,
      date: row.date,
      quantity: totalValueKRW > 0 ? 1 : 0,
      priceOriginal: totalValueKRW,
      exchangeRate: null,
      priceKRW: totalValueKRW,
      totalValueKRW,
    };
  }

  const quantity = parseNumberInput(row.quantityInput);
  const priceOriginal = parseNumberInput(row.priceOriginalInput);
  const priceKRW = parseNumberInput(row.priceKRWInput);
  if (quantity === null || priceOriginal === null || priceKRW === null) return null;
  if (quantity < 0 || priceOriginal < 0 || priceKRW < 0) return null;

  const exchangeRate = parseNumberInput(row.exchangeRateInput);
  if (exchangeRate !== null && exchangeRate <= 0) return null;

  return {
    holdingId: row.holdingId,
    accountId: row.accountId,
    assetMasterId: row.assetMasterId,
    date: row.date,
    quantity,
    priceOriginal,
    exchangeRate,
    priceKRW,
    totalValueKRW,
  };
}

function statusClass(status: AssetMonthlyInputStatus | null): string {
  return status
    ? statusStyles[status]
    : 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300';
}

function getLocalDraftKey(year: number, month: number): string {
  return `asset-monthly-input:${year}-${String(month).padStart(2, '0')}`;
}

function readLocalDraft(year: number, month: number): LocalMonthlyInputDraft | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(getLocalDraftKey(year, month));
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as LocalMonthlyInputDraft;
    if (
      parsed.version !== 1 ||
      parsed.year !== year ||
      parsed.month !== month ||
      !Array.isArray(parsed.rows)
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeLocalDraft(year: number, month: number, rows: EditableMonthlyRow[]): string {
  const savedAt = new Date().toISOString();
  const payload: LocalMonthlyInputDraft = {
    version: 1,
    year,
    month,
    savedAt,
    rows,
  };
  window.localStorage.setItem(getLocalDraftKey(year, month), JSON.stringify(payload));
  return savedAt;
}

function removeLocalDraft(year: number, month: number) {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(getLocalDraftKey(year, month));
}

function formatSavedAt(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getGroupKey(row: EditableMonthlyRow, groupMode: GroupMode): string {
  return groupMode === 'member' ? row.memberName : row.assetClass;
}

function buildGroups(rows: EditableMonthlyRow[], groupMode: GroupMode): MonthlyInputGroup[] {
  const groups = new Map<string, EditableMonthlyRow[]>();
  for (const row of rows) {
    const key = getGroupKey(row, groupMode);
    const group = groups.get(key);
    if (group) {
      group.push(row);
    } else {
      groups.set(key, [row]);
    }
  }

  return Array.from(groups.entries())
    .map(([key, groupRows]) => ({
      key,
      label: key,
      rows: groupRows,
      totalValue: groupRows.reduce((sum, row) => {
        const value = parseNumberInput(row.totalValueInput);
        return sum + (value ?? 0);
      }, 0),
      missingCount: groupRows.filter(
        row => (row.prevTotalValueKRW ?? 0) > 0 && row.totalValueInput.trim() === ''
      ).length,
      filledCount: groupRows.filter(row => row.totalValueInput.trim() !== '').length,
    }))
    .sort((a, b) => b.totalValue - a.totalValue || a.label.localeCompare(b.label, 'ko-KR'));
}

export function MonthlyAssetInputPanel({
  open,
  year,
  month,
  onClose,
  onSaved,
}: MonthlyAssetInputPanelProps) {
  const [draft, setDraft] = useState<AssetMonthlyInputDraft | null>(null);
  const [rows, setRows] = useState<EditableMonthlyRow[]>([]);
  const [institutions, setInstitutions] = useState<InstitutionOption[]>([]);
  const [accounts, setAccounts] = useState<AccountOption[]>([]);
  const [assetMasters, setAssetMasters] = useState<AssetMasterOption[]>([]);
  const [newHolding, setNewHolding] = useState<NewHoldingSelection>({
    accountId: '',
    assetMasterId: '',
  });
  const [showNewHoldingRow, setShowNewHoldingRow] = useState(false);
  const [groupMode, setGroupMode] = useState<GroupMode>('member');
  const [activeGroupKey, setActiveGroupKey] = useState<string>('all');
  const [localDraftSavedAt, setLocalDraftSavedAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    const loadDraft = async () => {
      setIsLoading(true);
      setError(null);
      setSuccessMessage(null);
      try {
        const [draftData, institutionData, accountData, assetMasterData] = await Promise.all([
          apiClient.asset.getMonthlyInput<AssetMonthlyInputDraft>(year, month),
          apiClient.asset.getInstitutions<InstitutionOption[]>(),
          apiClient.asset.getAccounts<AccountOption[]>(),
          apiClient.asset.getAssetMasters<AssetMasterOption[]>(),
        ]);

        setDraft(draftData);
        const localDraft = readLocalDraft(year, month);
        if (localDraft) {
          setRows(localDraft.rows);
          setLocalDraftSavedAt(localDraft.savedAt);
          setSuccessMessage('브라우저 임시저장본을 불러왔습니다.');
        } else {
          setRows(draftData.rows.map(toEditableRow));
          setLocalDraftSavedAt(null);
        }
        setInstitutions(institutionData);
        setAccounts(accountData);
        setAssetMasters(assetMasterData);
      } catch (err) {
        setError(err instanceof Error ? err.message : '입력 초안을 불러오지 못했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    loadDraft();
  }, [open, year, month]);

  const rowGroups = useMemo(() => buildGroups(rows, groupMode), [rows, groupMode]);

  useEffect(() => {
    if (activeGroupKey === 'all') return;
    if (!rowGroups.some(group => group.key === activeGroupKey)) {
      setActiveGroupKey('all');
    }
  }, [activeGroupKey, rowGroups]);

  const visibleGroups = useMemo(() => {
    if (activeGroupKey === 'all') return rowGroups;
    return rowGroups.filter(group => group.key === activeGroupKey);
  }, [activeGroupKey, rowGroups]);

  const prevTotalValue = draft?.prevTotalValue ?? 0;
  const currentTotalValue = useMemo(
    () =>
      rows.reduce((sum, row) => {
        const value = parseNumberInput(row.totalValueInput);
        return sum + (value ?? 0);
      }, 0),
    [rows]
  );
  const deltaAmount = currentTotalValue - prevTotalValue;
  const missingRows = rows.filter(
    row => (row.prevTotalValueKRW ?? 0) > 0 && row.totalValueInput.trim() === ''
  );
  const filledRowCount = rows.filter(row => row.totalValueInput.trim() !== '').length;

  const updateRow = (rowKey: string, field: keyof EditableMonthlyRow, value: string | boolean) => {
    setRows(prev =>
      prev.map(row => {
        if (row.rowKey !== rowKey) return row;

        const next = { ...row, [field]: value };
        if (typeof value !== 'string') return next;

        if (field === 'totalValueInput') {
          return next;
        }

        if (row.inputType === 'value') {
          return next;
        }

        const quantity = parseNumberInput(field === 'quantityInput' ? value : next.quantityInput);
        const priceOriginal = parseNumberInput(
          field === 'priceOriginalInput' ? value : next.priceOriginalInput
        );
        const exchangeRate = parseNumberInput(
          field === 'exchangeRateInput' ? value : next.exchangeRateInput
        );
        let priceKRW = parseNumberInput(field === 'priceKRWInput' ? value : next.priceKRWInput);

        if (field === 'priceOriginalInput' || field === 'exchangeRateInput') {
          if (next.currency === 'KRW' && priceOriginal !== null) {
            priceKRW = priceOriginal;
            next.priceKRWInput = String(priceOriginal);
          } else if (priceOriginal !== null && exchangeRate !== null) {
            priceKRW = Math.round(priceOriginal * exchangeRate * 100) / 100;
            next.priceKRWInput = String(priceKRW);
          }
        }

        if (
          (field === 'quantityInput' || field === 'priceKRWInput') &&
          quantity !== null &&
          priceKRW !== null
        ) {
          next.totalValueInput = String(Math.round(quantity * priceKRW));
        }

        if (
          (field === 'priceOriginalInput' || field === 'exchangeRateInput') &&
          quantity !== null &&
          priceKRW !== null
        ) {
          next.totalValueInput = String(Math.round(quantity * priceKRW));
        }

        return next;
      })
    );
  };

  const handleAddHolding = () => {
    if (!draft || !newHolding.accountId || !newHolding.assetMasterId) return;
    const account = accounts.find(item => item.id === newHolding.accountId);
    const assetMaster = assetMasters.find(item => item.id === newHolding.assetMasterId);
    if (!account || !assetMaster) return;
    if (
      rows.some(
        row =>
          row.accountId === newHolding.accountId && row.assetMasterId === newHolding.assetMasterId
      )
    ) {
      alert('이미 입력 목록에 있는 자산입니다.');
      return;
    }

    const institutionName =
      institutions.find(item => item.id === account.institutionId)?.name ?? '기타';
    const inputType = getInputType(assetMaster.assetClass, account.accountType);
    const rowKey = `new-${newHolding.accountId}-${newHolding.assetMasterId}-${Date.now()}`;
    const newRow: EditableMonthlyRow = {
      rowKey,
      holdingId: null,
      accountId: account.id,
      assetMasterId: assetMaster.id,
      currentSnapshotId: null,
      date: draft.date,
      assetName: assetMaster.name,
      assetClass: assetMaster.assetClass,
      subClass: null,
      riskLevel: assetMaster.riskLevel ?? '',
      currency: assetMaster.currency,
      memberName: account.memberName,
      accountName: account.name,
      accountType: account.accountType,
      institutionName,
      inputType,
      prevQuantity: null,
      prevPriceOriginal: null,
      prevExchangeRate: null,
      prevPriceKRW: null,
      prevTotalValueKRW: null,
      quantityInput: inputType === 'value' ? '1' : '',
      priceOriginalInput: '',
      exchangeRateInput: '',
      priceKRWInput: '',
      totalValueInput: '',
      isCurrentMissing: false,
      isExpanded: inputType === 'quantity',
      isNew: true,
    };

    setRows(prev => [...prev, newRow]);
    setActiveGroupKey(getGroupKey(newRow, groupMode));
    setNewHolding({ accountId: '', assetMasterId: '' });
    setShowNewHoldingRow(false);
  };

  const handleSaveLocalDraft = () => {
    if (typeof window === 'undefined') return;
    const savedAt = writeLocalDraft(year, month, rows);
    setLocalDraftSavedAt(savedAt);
    setSuccessMessage('임시 저장되었습니다.');
    setError(null);
  };

  const handleLoadLocalDraft = () => {
    const localDraft = readLocalDraft(year, month);
    if (!localDraft) {
      setLocalDraftSavedAt(null);
      setError('불러올 임시저장본이 없습니다.');
      return;
    }

    setRows(localDraft.rows);
    setLocalDraftSavedAt(localDraft.savedAt);
    setSuccessMessage('브라우저 임시저장본을 불러왔습니다.');
    setError(null);
  };

  const handleDeleteLocalDraft = () => {
    removeLocalDraft(year, month);
    setLocalDraftSavedAt(null);
    setSuccessMessage('임시저장본을 삭제했습니다.');
    setError(null);
  };

  const handleUpload = async () => {
    if (!draft) return;
    if (missingRows.length > 0) {
      alert(
        '전월 자산 중 이번 달 금액이 비어 있는 항목이 있습니다. 정리한 자산은 0원을 입력하세요.'
      );
      return;
    }

    const payloadRows = rows.map(buildPayloadRow);
    if (payloadRows.some(row => row === null)) {
      alert('입력값을 확인해주세요.');
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const savedDraft = await apiClient.asset.saveMonthlyInput<AssetMonthlyInputDraft>({
        year,
        month,
        rows: payloadRows as AssetMonthlyInputSaveRow[],
      });
      setDraft(savedDraft);
      setRows(savedDraft.rows.map(toEditableRow));
      removeLocalDraft(year, month);
      setLocalDraftSavedAt(null);
      setSuccessMessage('업로드되었습니다.');
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : '업로드에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950/40">
      <div className="absolute inset-y-0 right-0 flex w-full max-w-6xl flex-col bg-white shadow-2xl dark:bg-zinc-950 sm:w-[92vw]">
        <header className="border-b border-zinc-200 px-4 py-4 dark:border-zinc-800 sm:px-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                {year}년 {month}월 자산 마감
              </p>
              <h2 className="mt-1 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                {draft?.mode === 'edit' ? '기존 입력 수정' : '이번 달 자산 입력'}
              </h2>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleSaveLocalDraft}
                disabled={isLoading || rows.length === 0}
                className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                <Save size={16} />
                임시 저장
              </button>
              <button
                type="button"
                onClick={handleLoadLocalDraft}
                disabled={isLoading || !localDraftSavedAt}
                className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                <Download size={16} />
                불러오기
              </button>
              <button
                type="button"
                onClick={handleDeleteLocalDraft}
                disabled={isLoading || !localDraftSavedAt}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-500 transition-colors hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-rose-900/30 dark:hover:text-rose-300"
                title="임시저장 삭제"
              >
                <Trash2 size={16} />
              </button>
              <button
                type="button"
                onClick={handleUpload}
                disabled={isLoading || isSaving || rows.length === 0}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
              >
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                업로드
              </button>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                title="닫기"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
            <SummaryValue label="전월 총자산" value={formatAmount(prevTotalValue)} />
            <SummaryValue label="이번 달 총자산" value={formatAmount(currentTotalValue)} />
            <SummaryValue
              label="증감액"
              value={formatDelta(deltaAmount)}
              tone={deltaAmount > 0 ? 'positive' : deltaAmount < 0 ? 'negative' : 'neutral'}
            />
          </div>

          {localDraftSavedAt && (
            <p className="mt-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
              임시 저장 {formatSavedAt(localDraftSavedAt)}
            </p>
          )}

          {(error || successMessage || missingRows.length > 0) && (
            <div className="mt-3 space-y-2">
              {error && (
                <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-900/30 dark:text-rose-300">
                  {error}
                </p>
              )}
              {successMessage && (
                <p className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                  <Check size={15} />
                  {successMessage}
                </p>
              )}
              {missingRows.length > 0 && (
                <p className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                  <AlertTriangle size={15} />
                  전월 자산 {missingRows.length}개가 이번 달 금액 없이 남아 있습니다.
                </p>
              )}
            </div>
          )}
        </header>

        <div className="min-h-0 flex-1 overflow-auto px-4 py-4 sm:px-6">
          {isLoading ? (
            <div className="flex h-64 items-center justify-center text-sm text-zinc-500 dark:text-zinc-400">
              <Loader2 size={18} className="mr-2 animate-spin" />
              불러오는 중
            </div>
          ) : rows.length === 0 ? (
            <div className="rounded-lg border border-dashed border-zinc-300 px-4 py-12 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
              입력할 자산이 없습니다.
            </div>
          ) : (
            <>
              <div className="mb-3 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex rounded-lg border border-zinc-200 bg-zinc-50 p-1 text-sm font-medium dark:border-zinc-800 dark:bg-zinc-900">
                    <button
                      type="button"
                      onClick={() => {
                        setGroupMode('member');
                        setActiveGroupKey('all');
                      }}
                      className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 transition ${
                        groupMode === 'member'
                          ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-100'
                          : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100'
                      }`}
                    >
                      <Users size={15} />
                      소유자별
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setGroupMode('assetClass');
                        setActiveGroupKey('all');
                      }}
                      className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 transition ${
                        groupMode === 'assetClass'
                          ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-100'
                          : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100'
                      }`}
                    >
                      <Layers size={15} />
                      자산유형별
                    </button>
                  </div>
                  <div className="text-sm text-zinc-500 dark:text-zinc-400">
                    {rows.length}개 중 {filledRowCount}개 입력
                  </div>
                </div>

                <div className="flex gap-2 overflow-x-auto pb-1">
                  <GroupButton
                    label="전체"
                    count={rows.length}
                    filledCount={filledRowCount}
                    totalValue={currentTotalValue}
                    missingCount={missingRows.length}
                    active={activeGroupKey === 'all'}
                    onClick={() => setActiveGroupKey('all')}
                  />
                  {rowGroups.map(group => (
                    <GroupButton
                      key={group.key}
                      label={group.label}
                      count={group.rows.length}
                      filledCount={group.filledCount}
                      totalValue={group.totalValue}
                      missingCount={group.missingCount}
                      active={activeGroupKey === group.key}
                      onClick={() => setActiveGroupKey(group.key)}
                    />
                  ))}
                </div>
              </div>

              <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[920px] border-separate border-spacing-0 text-sm">
                    <thead className="bg-zinc-100 text-left text-xs font-semibold text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
                      <tr>
                        <th className="border-b border-zinc-200 px-3 py-2 dark:border-zinc-800">
                          자산명
                        </th>
                        <th className="border-b border-zinc-200 px-3 py-2 text-right dark:border-zinc-800">
                          전월
                        </th>
                        <th className="border-b border-zinc-200 px-3 py-2 text-right dark:border-zinc-800">
                          이번 달
                        </th>
                        <th className="border-b border-zinc-200 px-3 py-2 text-right dark:border-zinc-800">
                          증감
                        </th>
                        <th className="border-b border-zinc-200 px-3 py-2 dark:border-zinc-800">
                          메모/상태
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleGroups.map(group => (
                        <Fragment key={group.key}>
                          <tr className="bg-zinc-50 text-xs font-semibold text-zinc-500 dark:bg-zinc-900/80 dark:text-zinc-400">
                            <td
                              colSpan={5}
                              className="border-b border-zinc-200 px-3 py-2 dark:border-zinc-800"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <span>{group.label}</span>
                                <span>
                                  {group.filledCount}/{group.rows.length} ·{' '}
                                  {formatAmount(group.totalValue)}
                                </span>
                              </div>
                            </td>
                          </tr>
                          {group.rows.map(row => (
                            <MonthlyInputTableRows
                              key={row.rowKey}
                              row={row}
                              onUpdate={updateRow}
                              onRemove={() => {
                                if (!row.isNew) return;
                                setRows(prev => prev.filter(item => item.rowKey !== row.rowKey));
                              }}
                            />
                          ))}
                        </Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {draft && (
            <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900/60">
              {showNewHoldingRow ? (
                <div className="grid grid-cols-1 gap-2 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
                  <select
                    value={newHolding.accountId}
                    onChange={event =>
                      setNewHolding(prev => ({ ...prev, accountId: event.target.value }))
                    }
                    onKeyDown={handleMonthlyInputKeyDown}
                    className={selectClass}
                    data-monthly-input="true"
                  >
                    <option value="">계좌 선택</option>
                    {accounts.map(account => (
                      <option key={account.id} value={account.id}>
                        {account.memberName} · {account.name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={newHolding.assetMasterId}
                    onChange={event =>
                      setNewHolding(prev => ({ ...prev, assetMasterId: event.target.value }))
                    }
                    onKeyDown={handleMonthlyInputKeyDown}
                    className={selectClass}
                    data-monthly-input="true"
                  >
                    <option value="">자산 선택</option>
                    {assetMasters.map(assetMaster => (
                      <option key={assetMaster.id} value={assetMaster.id}>
                        {assetMaster.name} ({assetMaster.currency})
                      </option>
                    ))}
                  </select>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleAddHolding}
                      disabled={!newHolding.accountId || !newHolding.assetMasterId}
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-zinc-900 px-3 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
                    >
                      <Plus size={15} />
                      추가
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowNewHoldingRow(false)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-200 dark:text-zinc-400 dark:hover:bg-zinc-800"
                      title="취소"
                    >
                      <X size={15} />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowNewHoldingRow(true)}
                  className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                  <Plus size={15} />
                  자산 추가
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryValue({
  label,
  value,
  tone = 'neutral',
}: {
  label: string;
  value: string;
  tone?: 'positive' | 'negative' | 'neutral';
}) {
  const toneClass =
    tone === 'positive'
      ? 'text-emerald-600 dark:text-emerald-400'
      : tone === 'negative'
        ? 'text-rose-600 dark:text-rose-400'
        : 'text-zinc-900 dark:text-zinc-100';

  return (
    <div className="rounded-lg bg-zinc-50 px-3 py-2 dark:bg-zinc-900">
      <p className="text-xs text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className={`mt-1 text-base font-semibold ${toneClass}`}>{value}</p>
    </div>
  );
}

function GroupButton({
  label,
  count,
  filledCount,
  totalValue,
  missingCount,
  active,
  onClick,
}: {
  label: string;
  count: number;
  filledCount: number;
  totalValue: number;
  missingCount: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-w-[156px] rounded-lg border px-3 py-2 text-left transition ${
        active
          ? 'border-blue-500 bg-blue-50 text-blue-900 dark:border-blue-400 dark:bg-blue-950/50 dark:text-blue-100'
          : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-sm font-semibold">{label}</span>
        {missingCount > 0 && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
            {missingCount}
          </span>
        )}
      </div>
      <div className="mt-1 flex items-center justify-between gap-2 text-xs text-zinc-500 dark:text-zinc-400">
        <span>
          {filledCount}/{count}
        </span>
        <span className="font-medium">{formatAmount(totalValue)}</span>
      </div>
    </button>
  );
}

function MonthlyInputTableRows({
  row,
  onUpdate,
  onRemove,
}: {
  row: EditableMonthlyRow;
  onUpdate: (rowKey: string, field: keyof EditableMonthlyRow, value: string | boolean) => void;
  onRemove: () => void;
}) {
  const currentValue = parseNumberInput(row.totalValueInput);
  const prevValue = row.prevTotalValueKRW;
  const delta = currentValue === null ? null : currentValue - (prevValue ?? 0);
  const status = getStatus(prevValue, currentValue);
  const isMissing = (prevValue ?? 0) > 0 && row.totalValueInput.trim() === '';

  return (
    <>
      <tr className="border-b border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900/60">
        <td className="border-b border-zinc-200 px-3 py-2 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            {row.inputType === 'quantity' ? (
              <button
                type="button"
                onClick={() => onUpdate(row.rowKey, 'isExpanded', !row.isExpanded)}
                className="inline-flex h-6 w-6 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                title={row.isExpanded ? '접기' : '펼치기'}
              >
                {row.isExpanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
              </button>
            ) : (
              <span className="h-6 w-6" />
            )}
            <div className="min-w-0">
              <p className="truncate font-medium text-zinc-900 dark:text-zinc-100">
                {row.assetName}
              </p>
              <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                {row.assetClass} · {row.currency}
              </p>
            </div>
          </div>
        </td>
        <td className="border-b border-zinc-200 px-3 py-2 text-right text-zinc-600 dark:border-zinc-800 dark:text-zinc-300">
          {prevValue === null ? '-' : formatAmount(prevValue)}
        </td>
        <td className="border-b border-zinc-200 px-3 py-2 dark:border-zinc-800">
          <input
            type="number"
            min="0"
            step="any"
            value={row.totalValueInput}
            onChange={event => onUpdate(row.rowKey, 'totalValueInput', event.target.value)}
            onKeyDown={handleMonthlyInputKeyDown}
            className={numberInputClass}
            data-monthly-input="true"
          />
        </td>
        <td
          className={`border-b border-zinc-200 px-3 py-2 text-right font-medium dark:border-zinc-800 ${
            delta === null
              ? 'text-zinc-400'
              : delta > 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : delta < 0
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-zinc-500 dark:text-zinc-400'
          }`}
        >
          {formatDelta(delta)}
        </td>
        <td className="border-b border-zinc-200 px-3 py-2 dark:border-zinc-800">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusClass(status)}`}>
              {isMissing || status === null ? '입력 필요' : status}
            </span>
            {row.isNew && (
              <button
                type="button"
                onClick={onRemove}
                className="inline-flex h-6 w-6 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-900/30 dark:hover:text-rose-300"
                title="삭제"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </td>
      </tr>
      {row.inputType === 'quantity' && row.isExpanded && (
        <tr className="bg-zinc-50/80 dark:bg-zinc-900/40">
          <td colSpan={5} className="border-b border-zinc-200 px-3 py-3 dark:border-zinc-800">
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              <label className="space-y-1">
                <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">수량</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={row.quantityInput}
                  onChange={event => onUpdate(row.rowKey, 'quantityInput', event.target.value)}
                  onKeyDown={handleMonthlyInputKeyDown}
                  className={numberInputClass}
                  data-monthly-input="true"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">현재가</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={row.priceOriginalInput}
                  onChange={event => onUpdate(row.rowKey, 'priceOriginalInput', event.target.value)}
                  onKeyDown={handleMonthlyInputKeyDown}
                  className={numberInputClass}
                  data-monthly-input="true"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">환율</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={row.exchangeRateInput}
                  onChange={event => onUpdate(row.rowKey, 'exchangeRateInput', event.target.value)}
                  onKeyDown={handleMonthlyInputKeyDown}
                  className={numberInputClass}
                  data-monthly-input="true"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  원화 현재가
                </span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={row.priceKRWInput}
                  onChange={event => onUpdate(row.rowKey, 'priceKRWInput', event.target.value)}
                  onKeyDown={handleMonthlyInputKeyDown}
                  className={numberInputClass}
                  data-monthly-input="true"
                />
              </label>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
