'use client';

import { Fragment, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  Check,
  ChevronDown,
  ChevronRight,
  Download,
  Loader2,
  Plus,
  Save,
  Trash2,
  Upload,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { formatAmount } from '@/lib/format-utils';
import type {
  AssetMonthlyInputDraft,
  AssetMonthlyInputRow,
  AssetMonthlyInputSaveRow,
  AssetMonthlyInputStatus,
} from '@/types';
import type {
  AccountOption,
  AssetMasterOption,
  InstitutionOption,
  MemberOption,
} from '@/components/features/asset-transaction/types';
import { buildNewHoldingRow, getInputType, type EditableMonthlyRow } from './monthly-input-row';

interface MonthlyAssetInputPanelProps {
  open: boolean;
  year: number;
  month: number;
  onClose: () => void;
  onSaved: () => void;
}

interface NewHoldingSelection {
  accountId: string;
  assetMasterId: string;
}

interface AccountGroup {
  accountId: string;
  accountName: string;
  accountType: string;
  institutionName: string;
  rows: EditableMonthlyRow[];
  totalValue: number;
  filledCount: number;
  missingCount: number;
}

interface InputStep {
  key: string;
  memberName: string;
  label: string;
  institutionType: string;
  rows: EditableMonthlyRow[];
  accountGroups: AccountGroup[];
  totalValue: number;
  missingCount: number;
  filledCount: number;
  isComplete: boolean;
}

interface MemberSection {
  memberName: string;
  steps: InputStep[];
  completedSteps: number;
  totalSteps: number;
}

interface LocalMonthlyInputDraft {
  version: 1;
  year: number;
  month: number;
  savedAt: string;
  rows: EditableMonthlyRow[];
}

const numberInputClass =
  'h-8 w-full rounded-md border border-hairline bg-surface px-2 text-right text-sm text-ink focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent';

const selectClass =
  'h-8 w-full rounded-md border border-hairline bg-surface px-2 text-sm text-ink focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent';

const statusStyles: Record<AssetMonthlyInputStatus, string> = {
  유지: 'bg-surface-soft text-ink-muted',
  증가: 'gain-soft text-gain',
  감소: 'loss-soft text-loss',
  신규: 'accent-soft text-accent',
  정리됨: 'bg-goal/10 text-goal',
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
    avgCostInput: missing ? '' : String(row.avgCostKRW),
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
      avgCostKRW: totalValueKRW,
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

  // 평균단가(원금 기준) — 미입력 시 현재가로 시작(수익 0).
  const avgCostKRW = parseNumberInput(row.avgCostInput);
  if (avgCostKRW !== null && avgCostKRW < 0) return null;

  return {
    holdingId: row.holdingId,
    accountId: row.accountId,
    assetMasterId: row.assetMasterId,
    date: row.date,
    quantity,
    priceOriginal,
    exchangeRate,
    priceKRW,
    avgCostKRW: avgCostKRW ?? priceKRW,
    totalValueKRW,
  };
}

function statusClass(status: AssetMonthlyInputStatus | null): string {
  return status ? statusStyles[status] : 'bg-goal/10 text-goal';
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

const DEPOSIT_STEP_LABEL = '예금';

// 스텝(묶음) 단위: 은행류 기관은 소유자별 "예금" 한 스텝으로 묶고,
// 증권류 기관은 기관마다 한 스텝(예수금 + 종목)으로 나눈다.
function getStepLabel(row: EditableMonthlyRow): string {
  return row.institutionType === 'bank' ? DEPOSIT_STEP_LABEL : row.institutionName;
}

function getStepKey(memberName: string, stepLabel: string): string {
  return `${memberName} · ${stepLabel}`;
}

// 스텝 내 행 정렬: value형(현금성·예수금)을 먼저, quantity형(종목)을 뒤로.
function compareRowsWithinStep(a: EditableMonthlyRow, b: EditableMonthlyRow): number {
  if (a.inputType !== b.inputType) return a.inputType === 'value' ? -1 : 1;
  return `${a.institutionName}:${a.accountName}:${a.assetName}`.localeCompare(
    `${b.institutionName}:${b.accountName}:${b.assetName}`,
    'ko-KR'
  );
}

// 스텝 안에서 다시 계좌(accountName) 단위로 묶는다 — 표 안 접기/펼치기 그룹.
function buildAccountGroups(rows: EditableMonthlyRow[]): AccountGroup[] {
  const order: string[] = [];
  const byAccount = new Map<string, EditableMonthlyRow[]>();
  for (const row of rows) {
    const groupRows = byAccount.get(row.accountId);
    if (groupRows) {
      groupRows.push(row);
    } else {
      byAccount.set(row.accountId, [row]);
      order.push(row.accountId);
    }
  }

  return order
    .map(accountId => {
      const groupRows = [...byAccount.get(accountId)!].sort(compareRowsWithinStep);
      const first = groupRows[0];
      const filledCount = groupRows.filter(row => row.totalValueInput.trim() !== '').length;
      return {
        accountId,
        accountName: first.accountName,
        accountType: first.accountType,
        institutionName: first.institutionName,
        rows: groupRows,
        totalValue: groupRows.reduce(
          (sum, row) => sum + (parseNumberInput(row.totalValueInput) ?? 0),
          0
        ),
        filledCount,
        missingCount: groupRows.filter(
          row => (row.prevTotalValueKRW ?? 0) > 0 && row.totalValueInput.trim() === ''
        ).length,
      };
    })
    .sort(
      (a, b) => b.totalValue - a.totalValue || a.accountName.localeCompare(b.accountName, 'ko-KR')
    );
}

function buildInputStep(memberName: string, label: string, rows: EditableMonthlyRow[]): InputStep {
  const sortedRows = [...rows].sort(compareRowsWithinStep);
  const filledCount = sortedRows.filter(row => row.totalValueInput.trim() !== '').length;
  return {
    key: getStepKey(memberName, label),
    memberName,
    label,
    institutionType: sortedRows[0]?.institutionType ?? 'brokerage',
    rows: sortedRows,
    accountGroups: buildAccountGroups(rows),
    totalValue: sortedRows.reduce(
      (sum, row) => sum + (parseNumberInput(row.totalValueInput) ?? 0),
      0
    ),
    missingCount: sortedRows.filter(
      row => (row.prevTotalValueKRW ?? 0) > 0 && row.totalValueInput.trim() === ''
    ).length,
    filledCount,
    isComplete: sortedRows.length > 0 && filledCount === sortedRows.length,
  };
}

// 소유자 ▸ 기관 스텝의 2단 위계로 행을 묶는다.
function buildMemberSections(rows: EditableMonthlyRow[]): MemberSection[] {
  const memberOrder: string[] = [];
  const byMember = new Map<string, Map<string, EditableMonthlyRow[]>>();

  for (const row of rows) {
    let stepMap = byMember.get(row.memberName);
    if (!stepMap) {
      stepMap = new Map();
      byMember.set(row.memberName, stepMap);
      memberOrder.push(row.memberName);
    }
    const stepLabel = getStepLabel(row);
    const stepRows = stepMap.get(stepLabel);
    if (stepRows) {
      stepRows.push(row);
    } else {
      stepMap.set(stepLabel, [row]);
    }
  }

  return memberOrder.map(memberName => {
    const stepMap = byMember.get(memberName)!;
    const steps = Array.from(stepMap.entries())
      .map(([label, stepRows]) => buildInputStep(memberName, label, stepRows))
      // 예금 스텝을 먼저, 나머지 기관은 평가액 큰 순.
      .sort((a, b) => {
        if (a.label === DEPOSIT_STEP_LABEL) return -1;
        if (b.label === DEPOSIT_STEP_LABEL) return 1;
        return b.totalValue - a.totalValue || a.label.localeCompare(b.label, 'ko-KR');
      });
    return {
      memberName,
      steps,
      completedSteps: steps.filter(step => step.isComplete).length,
      totalSteps: steps.length,
    };
  });
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
  const [members, setMembers] = useState<MemberOption[]>([]);
  const [newHolding, setNewHolding] = useState<NewHoldingSelection>({
    accountId: '',
    assetMasterId: '',
  });
  const [showNewHoldingRow, setShowNewHoldingRow] = useState(false);
  const [activeStepKey, setActiveStepKey] = useState<string>('');
  const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(new Set());
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
        const [draftData, institutionData, accountData, assetMasterData, memberData] =
          await Promise.all([
            apiClient.asset.getMonthlyInput<AssetMonthlyInputDraft>(year, month),
            apiClient.asset.getInstitutions<InstitutionOption[]>(),
            apiClient.asset.getAccounts<AccountOption[]>(),
            apiClient.asset.getAssetMasters<AssetMasterOption[]>(),
            apiClient.asset.getMembers<MemberOption[]>(),
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
        setMembers(memberData);
      } catch (err) {
        setError(err instanceof Error ? err.message : '입력 초안을 불러오지 못했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    loadDraft();
  }, [open, year, month]);

  const sections = useMemo(() => buildMemberSections(rows), [rows]);
  const allSteps = useMemo(() => sections.flatMap(section => section.steps), [sections]);

  // 기본은 모든 묶음 접힘(activeStepKey=''). 활성 스텝이 사라지면 다시 접는다.
  useEffect(() => {
    if (activeStepKey === '') return;
    if (!allSteps.some(step => step.key === activeStepKey)) {
      setActiveStepKey('');
    }
  }, [activeStepKey, allSteps]);

  const activeStepIndex = allSteps.findIndex(step => step.key === activeStepKey);
  const nextStep = activeStepIndex >= 0 ? allSteps[activeStepIndex + 1] : undefined;

  const toggleAccount = (accountId: string) => {
    setExpandedAccounts(prev => {
      const next = new Set(prev);
      if (next.has(accountId)) {
        next.delete(accountId);
      } else {
        next.add(accountId);
      }
      return next;
    });
  };

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

  const handleCreateInstitution = async (data: {
    name: string;
    type: string;
  }): Promise<InstitutionOption> => {
    const created = await apiClient.asset.createInstitution<InstitutionOption>(data);
    setInstitutions(await apiClient.asset.getInstitutions<InstitutionOption[]>());
    return created;
  };

  const handleCreateAccount = async (data: {
    name: string;
    accountType: string;
    institutionId: string;
    memberId: string;
  }): Promise<AccountOption> => {
    const created = await apiClient.asset.createAccount<{ id: string }>(data);
    const fresh = await apiClient.asset.getAccounts<AccountOption[]>();
    setAccounts(fresh);
    const account = fresh.find(item => item.id === created.id);
    if (!account) throw new Error('생성한 계좌를 불러오지 못했습니다.');
    return account;
  };

  const handleCreateAssetMaster = async (data: {
    name: string;
    assetClass: string;
    currency: string;
    riskLevel: string;
  }): Promise<AssetMasterOption> => {
    const created = await apiClient.asset.createAssetMaster<{ id: string }>(data);
    const fresh = await apiClient.asset.getAssetMasters<AssetMasterOption[]>();
    setAssetMasters(fresh);
    const master = fresh.find(item => item.id === created.id);
    if (!master) throw new Error('생성한 종목을 불러오지 못했습니다.');
    return master;
  };

  const addAssetToAccount = (accountId: string, master: AssetMasterOption) => {
    if (!draft) return;
    const account = accounts.find(item => item.id === accountId);
    if (!account) return;
    const institution = institutions.find(item => item.id === account.institutionId);
    if (!institution) return;
    if (rows.some(row => row.accountId === accountId && row.assetMasterId === master.id)) {
      setError('이미 이 계좌에 있는 종목입니다.');
      return;
    }
    const row = buildNewHoldingRow({
      date: draft.date,
      account: {
        id: account.id,
        name: account.name,
        memberName: account.memberName,
        accountType: account.accountType,
      },
      institution: { name: institution.name, type: institution.type },
      assetMaster: {
        id: master.id,
        name: master.name,
        assetClass: master.assetClass,
        currency: master.currency,
        riskLevel: master.riskLevel,
      },
    });
    setRows(prev => [...prev, row]);
    const stepLabel = institution.type === 'bank' ? DEPOSIT_STEP_LABEL : institution.name;
    setActiveStepKey(getStepKey(account.memberName, stepLabel));
    setExpandedAccounts(prev => new Set(prev).add(accountId));
    setError(null);
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

    const institution = institutions.find(item => item.id === account.institutionId);
    const institutionName = institution?.name ?? '기타';
    const institutionType = institution?.type ?? 'brokerage';
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
      institutionType,
      inputType,
      prevQuantity: null,
      prevPriceOriginal: null,
      prevExchangeRate: null,
      prevPriceKRW: null,
      prevAvgCostKRW: null,
      prevTotalValueKRW: null,
      quantityInput: inputType === 'value' ? '1' : '',
      priceOriginalInput: '',
      exchangeRateInput: '',
      priceKRWInput: '',
      avgCostInput: '',
      totalValueInput: '',
      isCurrentMissing: false,
      isExpanded: inputType === 'quantity',
      isNew: true,
    };

    setRows(prev => [...prev, newRow]);
    setActiveStepKey(getStepKey(newRow.memberName, getStepLabel(newRow)));
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
    <div className="fixed inset-0 z-50 bg-ink/40">
      <div className="absolute inset-y-0 right-0 flex w-full max-w-6xl flex-col bg-surface shadow-2xl sm:w-[92vw]">
        <header className="border-b border-hairline px-4 py-4 sm:px-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-ink-subtle">
                {year}년 {month}월 자산 마감
              </p>
              <h2 className="mt-1 text-xl font-semibold text-ink">
                {draft?.mode === 'edit' ? '기존 입력 수정' : '이번 달 자산 입력'}
              </h2>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleSaveLocalDraft}
                disabled={isLoading || rows.length === 0}
                className="inline-flex items-center gap-2 rounded-lg border border-hairline bg-surface px-3 py-2 text-sm font-medium text-ink-muted transition-colors hover:bg-surface-soft disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Save size={16} />
                임시 저장
              </button>
              <button
                type="button"
                onClick={handleLoadLocalDraft}
                disabled={isLoading || !localDraftSavedAt}
                className="inline-flex items-center gap-2 rounded-lg border border-hairline bg-surface px-3 py-2 text-sm font-medium text-ink-muted transition-colors hover:bg-surface-soft disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Download size={16} />
                불러오기
              </button>
              <button
                type="button"
                onClick={handleDeleteLocalDraft}
                disabled={isLoading || !localDraftSavedAt}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-hairline bg-surface text-ink-subtle transition-colors hover:bg-loss/10 hover:text-loss disabled:cursor-not-allowed disabled:opacity-50"
                title="임시저장 삭제"
              >
                <Trash2 size={16} />
              </button>
              <button
                type="button"
                onClick={handleUpload}
                disabled={isLoading || isSaving || rows.length === 0}
                className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-on-accent transition-colors hover:bg-accent-press disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                업로드
              </button>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-ink-subtle transition-colors hover:bg-surface-soft hover:text-ink"
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
            <p className="mt-2 text-xs font-medium text-ink-subtle">
              임시 저장 {formatSavedAt(localDraftSavedAt)}
            </p>
          )}

          {(error || successMessage || missingRows.length > 0) && (
            <div className="mt-3 space-y-2">
              {error && <p className="rounded-lg loss-soft px-3 py-2 text-sm text-loss">{error}</p>}
              {successMessage && (
                <p className="flex items-center gap-2 rounded-lg gain-soft px-3 py-2 text-sm text-gain">
                  <Check size={15} />
                  {successMessage}
                </p>
              )}
              {missingRows.length > 0 && (
                <p className="flex items-center gap-2 rounded-lg bg-goal/10 px-3 py-2 text-sm text-goal">
                  <AlertTriangle size={15} />
                  전월 자산 {missingRows.length}개가 이번 달 금액 없이 남아 있습니다.
                </p>
              )}
            </div>
          )}
        </header>

        <div className="min-h-0 flex-1 overflow-auto px-4 py-4 sm:px-6">
          {isLoading ? (
            <div className="flex h-64 items-center justify-center text-sm text-ink-subtle">
              <Loader2 size={18} className="mr-2 animate-spin" />
              불러오는 중
            </div>
          ) : rows.length === 0 ? (
            <div className="rounded-lg border border-dashed border-hairline px-4 py-12 text-center text-sm text-ink-subtle">
              입력할 자산이 없습니다.
            </div>
          ) : (
            <>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-ink-subtle">
                  소유자 → 기관 순으로 한 묶음씩 점검하세요.
                </p>
                <div className="text-sm text-ink-subtle">
                  {rows.length}개 중 {filledRowCount}개 입력
                </div>
              </div>

              <div className="space-y-6">
                {sections.map(section => (
                  <section key={section.memberName} className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Users size={15} className="text-ink-subtle" />
                        <span className="text-sm font-semibold text-ink">{section.memberName}</span>
                      </div>
                      <span className="text-xs font-medium text-ink-subtle">
                        {section.completedSteps}/{section.totalSteps} 묶음 완료
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {section.steps.map(step => (
                        <StepChip
                          key={step.key}
                          step={step}
                          active={step.key === activeStepKey}
                          onClick={() =>
                            setActiveStepKey(curr => (curr === step.key ? '' : step.key))
                          }
                        />
                      ))}
                    </div>

                    {section.steps
                      .filter(step => step.key === activeStepKey)
                      .map(step => (
                        <StepTable
                          key={step.key}
                          step={step}
                          nextStep={nextStep}
                          expandedAccounts={expandedAccounts}
                          onToggleAccount={toggleAccount}
                          onUpdateRow={updateRow}
                          onRemoveRow={rowKey =>
                            setRows(prev => prev.filter(item => item.rowKey !== rowKey))
                          }
                          onNext={() => nextStep && setActiveStepKey(nextStep.key)}
                        />
                      ))}
                  </section>
                ))}
              </div>
            </>
          )}

          {draft && (
            <div className="mt-4 rounded-lg border border-hairline bg-canvas p-3">
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
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-action px-3 text-sm font-medium text-on-action transition-colors hover:bg-accent-press disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Plus size={15} />
                      추가
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowNewHoldingRow(false)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-ink-subtle transition-colors hover:bg-surface-soft"
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
                  className="inline-flex items-center gap-2 rounded-lg border border-hairline bg-surface px-3 py-2 text-sm font-medium text-ink-muted transition-colors hover:bg-surface-soft"
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
    tone === 'positive' ? 'text-gain' : tone === 'negative' ? 'text-loss' : 'text-ink';

  return (
    <div className="rounded-lg bg-canvas px-3 py-2">
      <p className="text-xs text-ink-subtle">{label}</p>
      <p className={`mt-1 text-base font-semibold ${toneClass}`}>{value}</p>
    </div>
  );
}

function StepChip({
  step,
  active,
  onClick,
}: {
  step: InputStep;
  active: boolean;
  onClick: () => void;
}) {
  const StepIcon = step.institutionType === 'bank' ? Wallet : Building2;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-w-[148px] rounded-lg border px-3 py-2 text-left transition ${
        active
          ? 'border-accent accent-soft text-accent'
          : 'border-hairline bg-surface text-ink-muted hover:bg-canvas'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-1.5 text-sm font-semibold">
          <StepIcon size={14} className="shrink-0" />
          <span className="truncate">{step.label}</span>
        </span>
        {step.isComplete ? (
          <Check size={14} className="shrink-0 text-gain" />
        ) : (
          step.missingCount > 0 && (
            <span className="rounded-full bg-goal/10 px-2 py-0.5 text-[11px] font-semibold text-goal">
              {step.missingCount}
            </span>
          )
        )}
      </div>
      <div className="mt-1 flex items-center justify-between gap-2 text-xs text-ink-subtle">
        <span>
          {step.filledCount}/{step.rows.length}
        </span>
        <span className="font-medium">{formatAmount(step.totalValue)}</span>
      </div>
    </button>
  );
}

function StepTable({
  step,
  nextStep,
  expandedAccounts,
  onToggleAccount,
  onUpdateRow,
  onRemoveRow,
  onNext,
}: {
  step: InputStep;
  nextStep: InputStep | undefined;
  expandedAccounts: Set<string>;
  onToggleAccount: (accountId: string) => void;
  onUpdateRow: (rowKey: string, field: keyof EditableMonthlyRow, value: string | boolean) => void;
  onRemoveRow: (rowKey: string) => void;
  onNext: () => void;
}) {
  const StepIcon = step.institutionType === 'bank' ? Wallet : Building2;
  const isSingleAccount = step.accountGroups.length <= 1;

  const renderRow = (row: EditableMonthlyRow, showContext: boolean) => (
    <MonthlyInputTableRows
      key={row.rowKey}
      row={row}
      showContext={showContext}
      onUpdate={onUpdateRow}
      onRemove={() => {
        if (!row.isNew) return;
        onRemoveRow(row.rowKey);
      }}
    />
  );

  return (
    <div className="overflow-hidden rounded-lg border border-accent/40 bg-surface">
      <div className="flex items-center justify-between gap-3 border-b border-hairline bg-canvas px-3 py-2">
        <span className="flex items-center gap-2 text-sm font-semibold text-ink">
          <StepIcon size={15} className="text-ink-subtle" />
          {step.label}
        </span>
        <span className="text-xs font-medium text-ink-subtle">
          {step.filledCount}/{step.rows.length} · {formatAmount(step.totalValue)}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px] border-separate border-spacing-0 text-sm">
          <thead className="bg-surface-soft text-left text-xs font-semibold text-ink-subtle">
            <tr>
              <th className="border-b border-hairline px-3 py-2">자산명</th>
              <th className="border-b border-hairline px-3 py-2 text-right">전월</th>
              <th className="border-b border-hairline px-3 py-2 text-right">이번 달</th>
              <th className="border-b border-hairline px-3 py-2 text-right">증감</th>
              <th className="border-b border-hairline px-3 py-2">메모/상태</th>
            </tr>
          </thead>
          <tbody>
            {isSingleAccount
              ? step.rows.map(row => renderRow(row, true))
              : step.accountGroups.map(group => {
                  const isOpen = expandedAccounts.has(group.accountId);
                  return (
                    <Fragment key={group.accountId}>
                      <tr className="bg-canvas">
                        <td colSpan={5} className="border-b border-hairline px-2 py-2">
                          <button
                            type="button"
                            onClick={() => onToggleAccount(group.accountId)}
                            className="flex w-full items-center justify-between gap-3 text-left"
                          >
                            <span className="flex min-w-0 items-center gap-1.5">
                              {isOpen ? (
                                <ChevronDown size={15} className="shrink-0 text-ink-faint" />
                              ) : (
                                <ChevronRight size={15} className="shrink-0 text-ink-faint" />
                              )}
                              <span className="truncate text-sm font-semibold text-ink">
                                {group.accountName}
                              </span>
                              <span className="truncate text-xs text-ink-subtle">
                                {group.institutionName}
                              </span>
                            </span>
                            <span className="flex shrink-0 items-center gap-2 text-xs font-medium text-ink-subtle">
                              {group.missingCount > 0 && (
                                <span className="rounded-full bg-goal/10 px-2 py-0.5 text-[11px] font-semibold text-goal">
                                  {group.missingCount}
                                </span>
                              )}
                              <span>
                                {group.filledCount}/{group.rows.length} ·{' '}
                                {formatAmount(group.totalValue)}
                              </span>
                            </span>
                          </button>
                        </td>
                      </tr>
                      {isOpen && group.rows.map(row => renderRow(row, false))}
                    </Fragment>
                  );
                })}
          </tbody>
        </table>
      </div>
      {nextStep && (
        <div className="flex justify-end border-t border-hairline px-3 py-2">
          <button
            type="button"
            onClick={onNext}
            className="inline-flex items-center gap-1.5 rounded-lg border border-hairline bg-surface px-3 py-1.5 text-sm font-medium text-ink-muted transition-colors hover:bg-surface-soft"
          >
            다음 묶음: {nextStep.label}
            <ArrowRight size={15} />
          </button>
        </div>
      )}
    </div>
  );
}

function MonthlyInputTableRows({
  row,
  showContext,
  onUpdate,
  onRemove,
}: {
  row: EditableMonthlyRow;
  showContext: boolean;
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
      <tr className="border-b border-hairline hover:bg-canvas">
        <td className="border-b border-hairline px-3 py-2">
          <div className="flex items-center gap-2">
            {row.inputType === 'quantity' ? (
              <button
                type="button"
                onClick={() => onUpdate(row.rowKey, 'isExpanded', !row.isExpanded)}
                className="inline-flex h-6 w-6 items-center justify-center rounded-md text-ink-faint hover:bg-surface-soft hover:text-ink-muted"
                title={row.isExpanded ? '접기' : '펼치기'}
              >
                {row.isExpanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
              </button>
            ) : (
              <span
                className="inline-flex h-6 w-6 items-center justify-center text-ink-faint"
                title="현금성"
              >
                <Wallet size={15} />
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate font-medium text-ink">{row.assetName}</p>
              <p className="truncate text-xs text-ink-subtle">
                {showContext
                  ? `${row.institutionName} · ${row.accountName}`
                  : `${row.assetClass} · ${row.currency}`}
              </p>
            </div>
          </div>
        </td>
        <td className="border-b border-hairline px-3 py-2 text-right text-ink-muted">
          {prevValue === null ? '-' : formatAmount(prevValue)}
        </td>
        <td className="border-b border-hairline px-3 py-2">
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
          className={`border-b border-hairline px-3 py-2 text-right font-medium ${
            delta === null
              ? 'text-ink-subtle'
              : delta > 0
                ? 'text-gain'
                : delta < 0
                  ? 'text-loss'
                  : 'text-ink-subtle'
          }`}
        >
          {formatDelta(delta)}
        </td>
        <td className="border-b border-hairline px-3 py-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusClass(status)}`}>
              {isMissing || status === null ? '입력 필요' : status}
            </span>
            {row.isNew && (
              <button
                type="button"
                onClick={onRemove}
                className="inline-flex h-6 w-6 items-center justify-center rounded-md text-ink-faint transition-colors hover:bg-loss/10 hover:text-loss"
                title="삭제"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </td>
      </tr>
      {row.inputType === 'quantity' && row.isExpanded && (
        <tr className="bg-surface-soft">
          <td colSpan={5} className="border-b border-hairline px-3 py-3">
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              <label className="space-y-1">
                <span className="text-xs font-medium text-ink-subtle">수량</span>
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
                <span className="text-xs font-medium text-ink-subtle">현재가</span>
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
                <span className="text-xs font-medium text-ink-subtle">환율</span>
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
                <span className="text-xs font-medium text-ink-subtle">원화 현재가</span>
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
              <label className="space-y-1">
                <span className="text-xs font-medium text-ink-subtle">평균단가(원화)</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={row.avgCostInput}
                  onChange={event => onUpdate(row.rowKey, 'avgCostInput', event.target.value)}
                  onKeyDown={handleMonthlyInputKeyDown}
                  className={numberInputClass}
                  data-monthly-input="true"
                  placeholder="미입력 시 현재가"
                />
              </label>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
