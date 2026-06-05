'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { ACCOUNT_TYPE, INSTITUTION_TYPE } from '@/constants/asset';
import { AssetMasterPicker } from './asset-master-picker';
import type {
  AccountOption,
  AssetMasterOption,
  InstitutionOption,
  MemberOption,
} from '@/components/features/asset-transaction/types';

const inputClass =
  'h-8 w-full rounded-md border border-hairline bg-surface px-2 text-sm text-ink focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent';

export function AddAccountFlow({
  members,
  institutions,
  assetMasters,
  onCreateInstitution,
  onCreateAccount,
  onCreateAssetMaster,
  onAddHolding,
}: {
  members: MemberOption[];
  institutions: InstitutionOption[];
  assetMasters: AssetMasterOption[];
  onCreateInstitution: (data: { name: string; type: string }) => Promise<InstitutionOption>;
  onCreateAccount: (data: {
    name: string;
    accountType: string;
    institutionId: string;
    memberId: string;
  }) => Promise<AccountOption>;
  onCreateAssetMaster: (data: {
    name: string;
    assetClass: string;
    currency: string;
    riskLevel: string;
  }) => Promise<AssetMasterOption>;
  onAddHolding: (accountId: string, assetMaster: AssetMasterOption) => void;
}) {
  const [stage, setStage] = useState<'idle' | 'form' | 'holding'>('idle');
  const [memberId, setMemberId] = useState('');
  const [institutionId, setInstitutionId] = useState('');
  const [newInstitution, setNewInstitution] = useState<{ name: string; type: string } | null>(null);
  const [accountForm, setAccountForm] = useState({
    name: '',
    accountType: ACCOUNT_TYPE[0] as string,
  });
  const [createdAccountId, setCreatedAccountId] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setStage('idle');
    setMemberId('');
    setInstitutionId('');
    setNewInstitution(null);
    setAccountForm({ name: '', accountType: ACCOUNT_TYPE[0] as string });
    setCreatedAccountId('');
    setError(null);
  };

  const canCreateAccount = Boolean(
    memberId &&
    accountForm.name.trim() &&
    (institutionId || (newInstitution && newInstitution.name.trim()))
  );

  const handleCreateAccount = async () => {
    setIsBusy(true);
    setError(null);
    try {
      let resolvedInstitutionId = institutionId;
      if (!resolvedInstitutionId && newInstitution && newInstitution.name.trim()) {
        const created = await onCreateInstitution({
          name: newInstitution.name.trim(),
          type: newInstitution.type,
        });
        resolvedInstitutionId = created.id;
      }
      const account = await onCreateAccount({
        name: accountForm.name.trim(),
        accountType: accountForm.accountType,
        institutionId: resolvedInstitutionId,
        memberId,
      });
      setCreatedAccountId(account.id);
      setStage('holding');
    } catch (err) {
      setError(err instanceof Error ? err.message : '계좌 생성에 실패했습니다.');
    } finally {
      setIsBusy(false);
    }
  };

  if (stage === 'idle') {
    return (
      <button
        type="button"
        onClick={() => setStage('form')}
        className="inline-flex items-center gap-2 rounded-lg border border-hairline bg-surface px-3 py-2 text-sm font-medium text-ink-muted transition-colors hover:bg-surface-soft"
      >
        <Plus size={15} />
        계좌·기관 추가
      </button>
    );
  }

  if (stage === 'holding') {
    return (
      <div className="space-y-2 rounded-lg border border-hairline bg-canvas p-3">
        <p className="text-sm font-medium text-ink">새 계좌에 첫 종목을 추가하세요.</p>
        <AssetMasterPicker
          assetMasters={assetMasters}
          excludeIds={new Set()}
          onCreate={onCreateAssetMaster}
          onPick={master => {
            onAddHolding(createdAccountId, master);
            reset();
          }}
          onCancel={reset}
        />
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-lg border border-hairline bg-canvas p-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-ink">새 계좌 추가</p>
        <button
          type="button"
          aria-label="닫기"
          onClick={reset}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-ink-subtle hover:bg-surface"
        >
          <X size={15} />
        </button>
      </div>

      <label className="block space-y-1">
        <span className="text-xs font-medium text-ink-subtle">소유자</span>
        <select
          className={inputClass}
          value={memberId}
          onChange={event => setMemberId(event.target.value)}
        >
          <option value="">선택</option>
          {members.map(member => (
            <option key={member.id} value={member.id}>
              {member.name}
            </option>
          ))}
        </select>
      </label>

      <div className="space-y-1">
        <span className="text-xs font-medium text-ink-subtle">기관</span>
        {newInstitution ? (
          <div className="flex flex-wrap items-center gap-2">
            <input
              className={`${inputClass} max-w-[180px]`}
              placeholder="기관명"
              aria-label="기관명"
              value={newInstitution.name}
              onChange={event =>
                setNewInstitution(prev => (prev ? { ...prev, name: event.target.value } : prev))
              }
            />
            <select
              className={`${inputClass} max-w-[120px]`}
              aria-label="기관 유형"
              value={newInstitution.type}
              onChange={event =>
                setNewInstitution(prev => (prev ? { ...prev, type: event.target.value } : prev))
              }
            >
              {INSTITUTION_TYPE.map(type => (
                <option key={type} value={type}>
                  {type === 'bank' ? '은행' : '증권'}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setNewInstitution(null)}
              className="text-sm text-ink-subtle hover:text-ink"
            >
              기존 선택
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <select
              className={`${inputClass} max-w-[220px]`}
              aria-label="기관 선택"
              value={institutionId}
              onChange={event => setInstitutionId(event.target.value)}
            >
              <option value="">기관 선택</option>
              {institutions.map(institution => (
                <option key={institution.id} value={institution.id}>
                  {institution.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => {
                setInstitutionId('');
                setNewInstitution({ name: '', type: INSTITUTION_TYPE[0] as string });
              }}
              className="text-sm text-ink-subtle hover:text-ink"
            >
              + 새 기관
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <label className="space-y-1">
          <span className="text-xs font-medium text-ink-subtle">계좌명</span>
          <input
            className={inputClass}
            placeholder="예: 연금저축펀드"
            aria-label="계좌명"
            value={accountForm.name}
            onChange={event => setAccountForm(prev => ({ ...prev, name: event.target.value }))}
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-medium text-ink-subtle">계좌 종류</span>
          <select
            className={inputClass}
            aria-label="계좌 종류"
            value={accountForm.accountType}
            onChange={event =>
              setAccountForm(prev => ({ ...prev, accountType: event.target.value }))
            }
          >
            {ACCOUNT_TYPE.map(type => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error && <p className="text-xs text-loss">{error}</p>}

      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={!canCreateAccount || isBusy}
          onClick={handleCreateAccount}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-action px-3 text-sm font-medium text-on-action transition-colors hover:bg-accent-press disabled:cursor-not-allowed disabled:opacity-50"
        >
          만들기
        </button>
      </div>
    </div>
  );
}
