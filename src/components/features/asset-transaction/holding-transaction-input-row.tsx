'use client';

import { forwardRef, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { Check, Loader2, Save, X } from 'lucide-react';
import { HOLDING_TRANSACTION_TYPE_OPTIONS } from '@/lib/constants';
import { formatAmount } from '@/lib/format-utils';
import { apiClient } from '@/lib/api-client';
import type {
  HoldingTransactionInputRow,
  HoldingTransactionInputRowRef,
  InstitutionOption,
  AccountOption,
  AssetMasterOption,
  MemberOption,
} from './types';

const baseInputClass =
  'h-7 w-full rounded-md border border-zinc-200 bg-white px-2 text-xs text-zinc-700 placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:placeholder:text-zinc-500 dark:focus:border-blue-400 dark:focus:ring-blue-400';

const miniInputClass =
  'h-6 w-full rounded border border-zinc-300 bg-white px-1.5 text-[11px] text-zinc-700 placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200';

const miniSelectClass =
  'h-6 w-full rounded border border-zinc-300 bg-white px-1 text-[11px] text-zinc-700 focus:border-blue-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200';

const CREATE_NEW = '__create_new__';

const ACCOUNT_TYPE_OPTIONS = [
  { value: 'savings', label: '예금' },
  { value: 'time_deposit', label: '정기예금' },
  { value: 'cma', label: 'CMA' },
  { value: 'regular', label: '위탁' },
  { value: 'pension_savings', label: '연금저축' },
  { value: 'irp', label: 'IRP' },
  { value: 'isa', label: 'ISA' },
] as const;

const ASSET_CLASS_OPTIONS = [
  { value: 'stock', label: '주식' },
  { value: 'bond', label: '채권' },
  { value: 'deposit', label: '예금' },
  { value: 'gold', label: '금' },
  { value: 'fund', label: '펀드' },
  { value: 'etf', label: 'ETF' },
] as const;

const CURRENCY_OPTIONS = [
  { value: 'KRW', label: 'KRW' },
  { value: 'USD', label: 'USD' },
] as const;

interface HoldingTransactionInputRowProps {
  row: HoldingTransactionInputRow;
  rowIndex: number;
  institutions: InstitutionOption[];
  accounts: AccountOption[];
  assetMasters: AssetMasterOption[];
  members: MemberOption[];
  selectedMemberName: string | null;
  defaultMemberId: string | null;
  rowPadding: string;
  onCellChange: (rowIndex: number, field: string, value: string) => void;
  onCellKeyDown: (rowIndex: number, colIndex: number, event: React.KeyboardEvent) => void;
  onCellFocus: (rowIndex: number, colIndex: number) => void;
  onSave: (rowIndex: number) => void;
  canSave: boolean;
  onInstitutionCreated: (inst: InstitutionOption) => void;
  onAccountCreated: (acc: AccountOption) => void;
  onAssetMasterCreated: (am: AssetMasterOption) => void;
}

export const HoldingTransactionInputRowComponent = forwardRef<
  HoldingTransactionInputRowRef,
  HoldingTransactionInputRowProps
>(
  (
    {
      row,
      rowIndex,
      institutions,
      accounts,
      assetMasters,
      members,
      selectedMemberName,
      defaultMemberId,
      rowPadding,
      onCellChange,
      onCellKeyDown,
      onCellFocus,
      onSave,
      canSave,
      onInstitutionCreated,
      onAccountCreated,
      onAssetMasterCreated,
    },
    ref
  ) => {
    const dateRef = useRef<HTMLInputElement>(null);
    const institutionRef = useRef<HTMLSelectElement>(null);
    const accountRef = useRef<HTMLSelectElement>(null);
    const assetMasterRef = useRef<HTMLSelectElement>(null);
    const typeRef = useRef<HTMLSelectElement>(null);
    const quantityRef = useRef<HTMLInputElement>(null);
    const priceOriginalRef = useRef<HTMLInputElement>(null);
    const priceKRWRef = useRef<HTMLInputElement>(null);
    const exchangeRateRef = useRef<HTMLInputElement>(null);
    const notesRef = useRef<HTMLInputElement>(null);

    const cellRefs = [
      dateRef,
      institutionRef,
      accountRef,
      assetMasterRef,
      typeRef,
      quantityRef,
      priceOriginalRef,
      priceKRWRef,
      exchangeRateRef,
      notesRef,
    ];

    useImperativeHandle(ref, () => ({
      focusCell: (colIndex: number) => {
        const cellRef = cellRefs[colIndex];
        if (cellRef?.current) {
          cellRef.current.focus();
        }
      },
    }));

    // Inline creation states
    const [creatingInstitution, setCreatingInstitution] = useState(false);
    const [creatingAccount, setCreatingAccount] = useState(false);
    const [creatingAssetMaster, setCreatingAssetMaster] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    // Inline form states
    const [newInst, setNewInst] = useState({ name: '', type: 'bank' });
    const [newAcct, setNewAcct] = useState({ name: '', accountType: 'regular', memberId: '' });
    const [newAsset, setNewAsset] = useState({
      name: '',
      assetClass: 'stock',
      currency: 'KRW',
    });

    const filteredAccounts = useMemo(() => {
      if (!row.institutionId) return [];
      return accounts.filter(a => a.institutionId === row.institutionId);
    }, [accounts, row.institutionId]);

    const handleSelectChange = (field: string, value: string) => {
      if (value === CREATE_NEW) {
        if (field === 'institutionId') {
          setCreatingInstitution(true);
          setNewInst({ name: '', type: 'bank' });
        } else if (field === 'accountId') {
          setCreatingAccount(true);
          setNewAcct({
            name: '',
            accountType: 'regular',
            memberId: defaultMemberId ?? members[0]?.id ?? '',
          });
        } else if (field === 'assetMasterId') {
          setCreatingAssetMaster(true);
          setNewAsset({ name: '', assetClass: 'stock', currency: 'KRW' });
        }
        return;
      }
      onCellChange(rowIndex, field, value);
    };

    const handleCreateInstitution = async () => {
      if (!newInst.name.trim()) return;
      setIsCreating(true);
      try {
        const created = await apiClient.asset.createInstitution<InstitutionOption>(newInst);
        onInstitutionCreated(created);
        onCellChange(rowIndex, 'institutionId', created.id);
        setCreatingInstitution(false);
      } catch (err) {
        console.error('Create institution error:', err);
      } finally {
        setIsCreating(false);
      }
    };

    const handleCreateAccount = async () => {
      if (!newAcct.name.trim() || !row.institutionId || !newAcct.memberId) return;
      setIsCreating(true);
      try {
        const created = await apiClient.asset.createAccount<{
          id: string;
          name: string;
          accountType: string;
        }>({
          name: newAcct.name,
          accountType: newAcct.accountType,
          institutionId: row.institutionId,
          memberId: newAcct.memberId,
        });
        const member = members.find(m => m.id === newAcct.memberId);
        onAccountCreated({
          id: created.id,
          name: created.name,
          institutionId: row.institutionId,
          memberName: member?.name ?? '',
          memberId: newAcct.memberId,
          accountType: created.accountType,
        });
        onCellChange(rowIndex, 'accountId', created.id);
        setCreatingAccount(false);
      } catch (err) {
        console.error('Create account error:', err);
      } finally {
        setIsCreating(false);
      }
    };

    const handleCreateAssetMaster = async () => {
      if (!newAsset.name.trim()) return;
      setIsCreating(true);
      try {
        const created = await apiClient.asset.createAssetMaster<AssetMasterOption>(newAsset);
        onAssetMasterCreated(created);
        onCellChange(rowIndex, 'assetMasterId', created.id);
        setCreatingAssetMaster(false);
      } catch (err) {
        console.error('Create asset master error:', err);
      } finally {
        setIsCreating(false);
      }
    };

    const getRowBgClass = () => {
      switch (row.status) {
        case 'saving':
          return 'bg-blue-50/50 dark:bg-blue-900/20';
        case 'saved':
          return 'bg-emerald-50/50 dark:bg-emerald-900/20';
        case 'error':
          return 'bg-rose-50/50 dark:bg-rose-900/20';
        case 'editing':
          return 'bg-amber-50/30 dark:bg-amber-900/10';
        default:
          return 'bg-zinc-50/50 dark:bg-zinc-800/30';
      }
    };

    const renderSaveButton = () => {
      if (row.status === 'saving') {
        return (
          <span className="inline-flex h-7 w-7 items-center justify-center text-blue-500">
            <Loader2 size={14} className="animate-spin" />
          </span>
        );
      }
      if (row.status === 'saved') {
        return (
          <span className="inline-flex h-7 w-7 items-center justify-center text-emerald-500">
            <Check size={14} />
          </span>
        );
      }
      return (
        <button
          type="button"
          onClick={() => onSave(rowIndex)}
          disabled={!canSave}
          className={`inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
            canSave
              ? 'text-blue-600 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900/50'
              : 'text-zinc-300 dark:text-zinc-600'
          }`}
          title={canSave ? '저장' : '계좌, 종목, 수량, 원화가격을 입력하세요'}
        >
          <Save size={14} />
        </button>
      );
    };

    const td = `border-r border-zinc-200 px-2 ${rowPadding} dark:border-zinc-700`;

    const inlineActionBtnClass =
      'inline-flex h-5 w-5 items-center justify-center rounded text-[10px] transition-colors';

    return (
      <tr className={`border-b border-zinc-200 dark:border-zinc-700 ${getRowBgClass()}`}>
        {/* Save button */}
        <td
          className={`border-r border-zinc-200 px-2 ${rowPadding} text-center dark:border-zinc-700`}
        >
          {renderSaveButton()}
        </td>

        {/* Date */}
        <td className={td}>
          <input
            ref={dateRef}
            type="date"
            value={row.date}
            onChange={e => onCellChange(rowIndex, 'date', e.target.value)}
            onKeyDown={e => onCellKeyDown(rowIndex, 0, e)}
            onFocus={() => onCellFocus(rowIndex, 0)}
            className={baseInputClass}
          />
        </td>

        {/* Member (read-only) */}
        <td className={`${td} text-xs text-zinc-500 dark:text-zinc-400`}>
          {selectedMemberName ?? '-'}
        </td>

        {/* Institution */}
        <td className={td}>
          {creatingInstitution ? (
            <div className="flex flex-col gap-1">
              <input
                type="text"
                value={newInst.name}
                onChange={e => setNewInst(prev => ({ ...prev, name: e.target.value }))}
                placeholder="기관명"
                className={miniInputClass}
                autoFocus
              />
              <div className="flex items-center gap-1">
                <select
                  value={newInst.type}
                  onChange={e => setNewInst(prev => ({ ...prev, type: e.target.value }))}
                  className={miniSelectClass}
                >
                  <option value="bank">은행</option>
                  <option value="brokerage">증권</option>
                </select>
                <button
                  type="button"
                  onClick={handleCreateInstitution}
                  disabled={isCreating || !newInst.name.trim()}
                  className={`${inlineActionBtnClass} bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50`}
                >
                  {isCreating ? (
                    <Loader2 size={10} className="animate-spin" />
                  ) : (
                    <Check size={10} />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setCreatingInstitution(false)}
                  className={`${inlineActionBtnClass} bg-zinc-300 text-zinc-600 hover:bg-zinc-400 dark:bg-zinc-600 dark:text-zinc-300`}
                >
                  <X size={10} />
                </button>
              </div>
            </div>
          ) : (
            <select
              ref={institutionRef}
              value={row.institutionId}
              onChange={e => handleSelectChange('institutionId', e.target.value)}
              onKeyDown={e => onCellKeyDown(rowIndex, 1, e)}
              onFocus={() => onCellFocus(rowIndex, 1)}
              className={baseInputClass}
            >
              <option value="">선택</option>
              {institutions.map(inst => (
                <option key={inst.id} value={inst.id}>
                  {inst.name}
                </option>
              ))}
              <option value={CREATE_NEW}>+ 새 기관</option>
            </select>
          )}
        </td>

        {/* Account */}
        <td className={td}>
          {creatingAccount ? (
            <div className="flex flex-col gap-1">
              <input
                type="text"
                value={newAcct.name}
                onChange={e => setNewAcct(prev => ({ ...prev, name: e.target.value }))}
                placeholder="계좌명"
                className={miniInputClass}
                autoFocus
              />
              <div className="flex items-center gap-1">
                <select
                  value={newAcct.accountType}
                  onChange={e => setNewAcct(prev => ({ ...prev, accountType: e.target.value }))}
                  className={miniSelectClass}
                >
                  {ACCOUNT_TYPE_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <select
                  value={newAcct.memberId}
                  onChange={e => setNewAcct(prev => ({ ...prev, memberId: e.target.value }))}
                  className={miniSelectClass}
                >
                  <option value="">구성원</option>
                  {members.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center justify-end gap-1">
                <button
                  type="button"
                  onClick={handleCreateAccount}
                  disabled={
                    isCreating || !newAcct.name.trim() || !row.institutionId || !newAcct.memberId
                  }
                  className={`${inlineActionBtnClass} bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50`}
                >
                  {isCreating ? (
                    <Loader2 size={10} className="animate-spin" />
                  ) : (
                    <Check size={10} />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setCreatingAccount(false)}
                  className={`${inlineActionBtnClass} bg-zinc-300 text-zinc-600 hover:bg-zinc-400 dark:bg-zinc-600 dark:text-zinc-300`}
                >
                  <X size={10} />
                </button>
              </div>
            </div>
          ) : (
            <select
              ref={accountRef}
              value={row.accountId}
              onChange={e => handleSelectChange('accountId', e.target.value)}
              onKeyDown={e => onCellKeyDown(rowIndex, 2, e)}
              onFocus={() => onCellFocus(rowIndex, 2)}
              className={baseInputClass}
              disabled={!row.institutionId}
            >
              <option value="">{row.institutionId ? '선택' : '기관 먼저'}</option>
              {filteredAccounts.map(acc => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({acc.memberName})
                </option>
              ))}
              {row.institutionId && <option value={CREATE_NEW}>+ 새 계좌</option>}
            </select>
          )}
        </td>

        {/* Asset Master */}
        <td className={td}>
          {creatingAssetMaster ? (
            <div className="flex flex-col gap-1">
              <input
                type="text"
                value={newAsset.name}
                onChange={e => setNewAsset(prev => ({ ...prev, name: e.target.value }))}
                placeholder="종목명"
                className={miniInputClass}
                autoFocus
              />
              <div className="flex items-center gap-1">
                <select
                  value={newAsset.assetClass}
                  onChange={e => setNewAsset(prev => ({ ...prev, assetClass: e.target.value }))}
                  className={miniSelectClass}
                >
                  {ASSET_CLASS_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <select
                  value={newAsset.currency}
                  onChange={e => setNewAsset(prev => ({ ...prev, currency: e.target.value }))}
                  className={miniSelectClass}
                >
                  {CURRENCY_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleCreateAssetMaster}
                  disabled={isCreating || !newAsset.name.trim()}
                  className={`${inlineActionBtnClass} bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50`}
                >
                  {isCreating ? (
                    <Loader2 size={10} className="animate-spin" />
                  ) : (
                    <Check size={10} />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setCreatingAssetMaster(false)}
                  className={`${inlineActionBtnClass} bg-zinc-300 text-zinc-600 hover:bg-zinc-400 dark:bg-zinc-600 dark:text-zinc-300`}
                >
                  <X size={10} />
                </button>
              </div>
            </div>
          ) : (
            <select
              ref={assetMasterRef}
              value={row.assetMasterId}
              onChange={e => handleSelectChange('assetMasterId', e.target.value)}
              onKeyDown={e => onCellKeyDown(rowIndex, 3, e)}
              onFocus={() => onCellFocus(rowIndex, 3)}
              className={baseInputClass}
            >
              <option value="">선택</option>
              {assetMasters.map(am => (
                <option key={am.id} value={am.id}>
                  {am.name} ({am.currency})
                </option>
              ))}
              <option value={CREATE_NEW}>+ 새 종목</option>
            </select>
          )}
        </td>

        {/* Transaction Type */}
        <td className={td}>
          <select
            ref={typeRef}
            value={row.transactionType}
            onChange={e => onCellChange(rowIndex, 'transactionType', e.target.value)}
            onKeyDown={e => onCellKeyDown(rowIndex, 4, e)}
            onFocus={() => onCellFocus(rowIndex, 4)}
            className={baseInputClass}
          >
            {HOLDING_TRANSACTION_TYPE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </td>

        {/* Quantity */}
        <td className={td}>
          <input
            ref={quantityRef}
            type="number"
            value={row.quantity}
            onChange={e => onCellChange(rowIndex, 'quantity', e.target.value)}
            onKeyDown={e => onCellKeyDown(rowIndex, 5, e)}
            onFocus={() => onCellFocus(rowIndex, 5)}
            placeholder="수량"
            className={`${baseInputClass} text-right`}
            min="0"
            step="any"
          />
        </td>

        {/* Price Original */}
        <td className={td}>
          <input
            ref={priceOriginalRef}
            type="number"
            value={row.priceOriginal}
            onChange={e => onCellChange(rowIndex, 'priceOriginal', e.target.value)}
            onKeyDown={e => onCellKeyDown(rowIndex, 6, e)}
            onFocus={() => onCellFocus(rowIndex, 6)}
            placeholder="원가"
            className={`${baseInputClass} text-right`}
            min="0"
            step="any"
          />
        </td>

        {/* Price KRW */}
        <td className={td}>
          <input
            ref={priceKRWRef}
            type="number"
            value={row.priceKRW}
            onChange={e => onCellChange(rowIndex, 'priceKRW', e.target.value)}
            onKeyDown={e => onCellKeyDown(rowIndex, 7, e)}
            onFocus={() => onCellFocus(rowIndex, 7)}
            placeholder="원화가격"
            className={`${baseInputClass} text-right`}
            min="0"
            step="any"
          />
        </td>

        {/* Exchange Rate */}
        <td className={td}>
          <input
            ref={exchangeRateRef}
            type="number"
            value={row.exchangeRate}
            onChange={e => onCellChange(rowIndex, 'exchangeRate', e.target.value)}
            onKeyDown={e => onCellKeyDown(rowIndex, 8, e)}
            onFocus={() => onCellFocus(rowIndex, 8)}
            placeholder="환율"
            className={`${baseInputClass} text-right`}
            min="0"
            step="any"
          />
        </td>

        {/* Total KRW (auto-calculated) */}
        <td
          className={`border-r border-zinc-200 px-2 ${rowPadding} text-right text-xs text-zinc-500 dark:border-zinc-700 dark:text-zinc-400`}
        >
          {(() => {
            const q = parseFloat(row.quantity);
            const p = parseFloat(row.priceKRW);
            if (!isNaN(q) && !isNaN(p) && q > 0 && p > 0) {
              return formatAmount(q * p);
            }
            return '-';
          })()}
        </td>

        {/* Notes */}
        <td className={`px-2 ${rowPadding}`}>
          <input
            ref={notesRef}
            type="text"
            value={row.notes}
            onChange={e => onCellChange(rowIndex, 'notes', e.target.value)}
            onKeyDown={e => onCellKeyDown(rowIndex, 9, e)}
            onFocus={() => onCellFocus(rowIndex, 9)}
            placeholder="메모"
            className={baseInputClass}
          />
        </td>
      </tr>
    );
  }
);

HoldingTransactionInputRowComponent.displayName = 'HoldingTransactionInputRow';
