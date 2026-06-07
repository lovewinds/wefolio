# 자산 추가 흐름 인라인 생성 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 월별 자산 입력 패널의 "자산 추가"를 위계(기관 ▸ 계좌 ▸ 종목)에 맞춰, 흔한 A(기존 계좌에 새 종목)는 계좌 컨텍스트 인라인으로, 가끔의 B·C(새 계좌·기관)는 가이드 드릴다운으로 재설계한다. 기관/계좌/종목은 입력 흐름 안에서 즉시 생성한다.

**Architecture:** 행 생성 순수 로직을 `monthly-input-row.ts`로 분리(TDD)하고, 종목 선택/생성(`AssetMasterPicker`), 계좌 컨텍스트 추가(`AddHoldingInline`), 새 계좌·기관 드릴다운(`AddAccountFlow`) 세 컴포넌트로 나눈다. 기준 데이터는 `apiClient.create*` + 목록 refetch로 즉시 영속, 보유 행은 기존처럼 업로드 시 스냅샷으로 확정.

**Tech Stack:** Next.js(App Router) 클라이언트 컴포넌트, React Hooks, Tailwind 시맨틱 토큰, Vitest + jsdom, zod 검증(기존), Prisma(기존 생성 API 재사용).

설계 스펙: `docs/superpowers/specs/2026-06-05-asset-add-flow-inline-creation-design.md`

---

## File Structure

- **Create** `src/components/features/asset/monthly-input-row.ts` — `EditableMonthlyRow` 타입, `getInputType`, 순수 빌더 `buildNewHoldingRow` (패널에서 이동/추가, 테스트 대상).
- **Create** `src/components/features/asset/monthly-input-row.test.ts` — 빌더/입력유형 단위 테스트.
- **Create** `src/components/features/asset/asset-master-picker.tsx` — 종목 선택 또는 신규 생성 (A·B·C 공용).
- **Create** `src/components/features/asset/add-holding-inline.tsx` — 계좌 컨텍스트 "+ 종목 추가".
- **Create** `src/components/features/asset/add-account-flow.tsx` — "+ 계좌·기관 추가" 드릴다운(소유자→기관→계좌→첫 종목).
- **Modify** `src/components/features/asset/monthly-asset-input-panel.tsx` — 타입/`getInputType` import 전환, 멤버 로드, 생성·추가 핸들러, `StepTable`에 인라인 추가 배선, 하단 평면 추가 UI를 `AddAccountFlow`로 교체.
- **Modify** `docs/known-risks.md`, `docs/manual-checklist.md`, `docs/product/asset-management.md` — 제약·수동 체크·추가 흐름 문서화.

기존 재사용: `apiClient.asset.create{Institution,Account,AssetMaster}` / `get{Institutions,Accounts,AssetMasters,Members}`, 패널의 `getStepKey`·`DEPOSIT_STEP_LABEL`·`setActiveStepKey`·`setExpandedAccounts`, 상수 `@/constants/asset`.

---

## Task 1: 행 빌더 모듈 분리 (TDD)

**Files:**
- Create: `src/components/features/asset/monthly-input-row.ts`
- Test: `src/components/features/asset/monthly-input-row.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

`src/components/features/asset/monthly-input-row.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { buildNewHoldingRow, getInputType } from './monthly-input-row';

describe('getInputType', () => {
  it('예금 계좌는 value형', () => {
    expect(getInputType('주식', '예금')).toBe('value');
  });
  it('CMA 계좌는 value형', () => {
    expect(getInputType('주식', 'CMA')).toBe('value');
  });
  it('종합 계좌의 주식은 quantity형', () => {
    expect(getInputType('주식', '종합')).toBe('quantity');
  });
});

describe('buildNewHoldingRow', () => {
  const base = {
    date: '2026-06-30',
    account: { id: 'acc1', name: '연금저축펀드', memberName: '남편', accountType: '연금저축' },
    institution: { name: '나무증권', type: 'brokerage' },
    assetMaster: {
      id: 'am1',
      name: 'ACE미국나스닥100',
      assetClass: '주식',
      currency: 'KRW',
      riskLevel: '위험자산',
    },
  };

  it('계좌·기관·종목 맥락을 행에 채운다', () => {
    const row = buildNewHoldingRow(base);
    expect(row.accountId).toBe('acc1');
    expect(row.assetMasterId).toBe('am1');
    expect(row.memberName).toBe('남편');
    expect(row.institutionName).toBe('나무증권');
    expect(row.institutionType).toBe('brokerage');
    expect(row.accountName).toBe('연금저축펀드');
    expect(row.isNew).toBe(true);
    expect(row.holdingId).toBeNull();
    expect(row.rowKey).toBe('new-acc1-am1');
  });

  it('종목이면 quantity형으로 펼침', () => {
    const row = buildNewHoldingRow(base);
    expect(row.inputType).toBe('quantity');
    expect(row.isExpanded).toBe(true);
    expect(row.quantityInput).toBe('');
  });

  it('예금류 계좌는 value형으로 수량 1', () => {
    const row = buildNewHoldingRow({
      ...base,
      account: { ...base.account, accountType: '예금' },
      institution: { name: '신한은행', type: 'bank' },
    });
    expect(row.inputType).toBe('value');
    expect(row.quantityInput).toBe('1');
    expect(row.isExpanded).toBe(false);
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `pnpm exec vitest run src/components/features/asset/monthly-input-row.test.ts`
Expected: FAIL — `monthly-input-row` 모듈/함수 없음.

- [ ] **Step 3: 모듈 구현**

`src/components/features/asset/monthly-input-row.ts`:

```ts
import type { AssetMonthlyInputRow, AssetMonthlyInputType } from '@/types';

export interface EditableMonthlyRow
  extends Omit<
    AssetMonthlyInputRow,
    | 'holdingId'
    | 'quantity'
    | 'priceOriginal'
    | 'exchangeRate'
    | 'priceKRW'
    | 'avgCostKRW'
    | 'totalValueKRW'
    | 'status'
  > {
  rowKey: string;
  holdingId: string | null;
  quantityInput: string;
  priceOriginalInput: string;
  exchangeRateInput: string;
  priceKRWInput: string;
  avgCostInput: string;
  totalValueInput: string;
  isExpanded: boolean;
  isNew: boolean;
}

export function getInputType(assetClass: string, accountType: string): AssetMonthlyInputType {
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

  return valueOnlyTokens.some(token => lowerAssetClass.includes(token) || lowerAccountType === token)
    ? 'value'
    : 'quantity';
}

export function buildNewHoldingRow(params: {
  date: string;
  account: { id: string; name: string; memberName: string; accountType: string };
  institution: { name: string; type: string };
  assetMaster: { id: string; name: string; assetClass: string; currency: string; riskLevel?: string };
}): EditableMonthlyRow {
  const { date, account, institution, assetMaster } = params;
  const inputType = getInputType(assetMaster.assetClass, account.accountType);
  return {
    rowKey: `new-${account.id}-${assetMaster.id}`,
    holdingId: null,
    accountId: account.id,
    assetMasterId: assetMaster.id,
    currentSnapshotId: null,
    date,
    assetName: assetMaster.name,
    assetClass: assetMaster.assetClass,
    subClass: null,
    riskLevel: assetMaster.riskLevel ?? '',
    currency: assetMaster.currency,
    memberName: account.memberName,
    accountName: account.name,
    accountType: account.accountType,
    institutionName: institution.name,
    institutionType: institution.type,
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
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `pnpm exec vitest run src/components/features/asset/monthly-input-row.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: 커밋**

```bash
git add src/components/features/asset/monthly-input-row.ts src/components/features/asset/monthly-input-row.test.ts
git commit -m "feat(asset): 보유 행 빌더·입력유형 판별을 monthly-input-row 모듈로 분리"
```

---

## Task 2: 패널 — 모듈 전환 + 멤버 로드 + 생성/추가 핸들러

**Files:**
- Modify: `src/components/features/asset/monthly-asset-input-panel.tsx`

- [ ] **Step 1: 타입/`getInputType`를 모듈에서 import로 전환**

패널 상단 import 블록에 추가(기존 `@/types`/lucide import 아래):

```ts
import {
  buildNewHoldingRow,
  getInputType,
  type EditableMonthlyRow,
} from './monthly-input-row';
```

패널 안의 **로컬 `interface EditableMonthlyRow { ... }` 정의 전체와 로컬 `function getInputType(...) { ... }` 정의 전체를 삭제**한다(모듈로 이동했으므로). 나머지 코드의 `EditableMonthlyRow`/`getInputType` 참조는 import로 그대로 동작한다.

- [ ] **Step 2: 멤버 목록 로드 추가**

`MemberOption`을 import에 추가:

```ts
import type {
  AccountOption,
  AssetMasterOption,
  InstitutionOption,
  MemberOption,
} from '@/components/features/asset-transaction/types';
```

멤버 state 추가(다른 `useState` 목록 옆):

```ts
const [members, setMembers] = useState<MemberOption[]>([]);
```

`loadDraft`의 `Promise.all`에 멤버 조회를 추가하고 setState:

```ts
const [draftData, institutionData, accountData, assetMasterData, memberData] = await Promise.all([
  apiClient.asset.getMonthlyInput<AssetMonthlyInputDraft>(year, month),
  apiClient.asset.getInstitutions<InstitutionOption[]>(),
  apiClient.asset.getAccounts<AccountOption[]>(),
  apiClient.asset.getAssetMasters<AssetMasterOption[]>(),
  apiClient.asset.getMembers<MemberOption[]>(),
]);
```

그리고 setState 블록(`setInstitutions(...)` 부근)에 추가:

```ts
setMembers(memberData);
```

- [ ] **Step 3: 생성 핸들러 + addAssetToAccount 추가**

`updateRow` 정의 부근(컴포넌트 본문)에 추가. 생성은 즉시 영속 후 목록 refetch하여 반환:

```ts
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
```

> 참고: 이 시점에는 기존 `handleAddHolding`/하단 평면 추가 UI가 그대로 남아 있어도 컴파일된다. Task 5에서 교체한다.

- [ ] **Step 4: 타입체크·린트**

Run: `pnpm exec tsc --noEmit && pnpm exec eslint src/components/features/asset/monthly-asset-input-panel.tsx`
Expected: 에러 없음. (미사용 경고가 나오면 Task 5에서 정리되는 `handleAddHolding` 관련일 수 있으니, 이 단계에서는 `handleAddHolding`을 남겨둔 채 통과해야 한다. 새로 추가한 핸들러가 아직 미사용이라 `no-unused-vars`가 뜨면 Step 5에서 곧 쓰이므로, 먼저 Task 3·4를 끝낸 뒤 최종 린트한다.)

- [ ] **Step 5: 커밋**

```bash
git add src/components/features/asset/monthly-asset-input-panel.tsx
git commit -m "feat(asset): 입력 패널에 멤버 로드·기준데이터 생성·계좌별 종목추가 핸들러 추가"
```

---

## Task 3: AssetMasterPicker (종목 선택/생성 공용)

**Files:**
- Create: `src/components/features/asset/asset-master-picker.tsx`

- [ ] **Step 1: 컴포넌트 구현**

`src/components/features/asset/asset-master-picker.tsx`:

```tsx
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
      !excludeIds.has(master.id) &&
      master.name.toLowerCase().includes(filter.trim().toLowerCase())
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
            className={inputClass}
            placeholder="종목명"
            value={form.name}
            onChange={event => setForm(prev => ({ ...prev, name: event.target.value }))}
          />
          <select
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
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-action px-3 text-sm font-medium text-on-action transition-colors hover:bg-accent-press disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Check size={15} />
            만들고 추가
          </button>
          <button
            type="button"
            onClick={() => setMode('select')}
            className="text-sm text-ink-subtle hover:text-ink"
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
          className={`${inputClass} max-w-[180px]`}
          placeholder="종목 검색"
          value={filter}
          onChange={event => setFilter(event.target.value)}
        />
        <select
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
          className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-action px-3 text-sm font-medium text-on-action transition-colors hover:bg-accent-press disabled:cursor-not-allowed disabled:opacity-50"
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
```

- [ ] **Step 2: 타입체크·린트**

Run: `pnpm exec tsc --noEmit && pnpm exec eslint src/components/features/asset/asset-master-picker.tsx`
Expected: 에러 없음.

- [ ] **Step 3: 커밋**

```bash
git add src/components/features/asset/asset-master-picker.tsx
git commit -m "feat(asset): 종목 선택·신규 생성 공용 AssetMasterPicker 추가"
```

---

## Task 4: AddHoldingInline + StepTable 배선

**Files:**
- Create: `src/components/features/asset/add-holding-inline.tsx`
- Modify: `src/components/features/asset/monthly-asset-input-panel.tsx` (`StepTable`)

- [ ] **Step 1: AddHoldingInline 구현**

`src/components/features/asset/add-holding-inline.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { AssetMasterPicker } from './asset-master-picker';
import type { AssetMasterOption } from '@/components/features/asset-transaction/types';

export function AddHoldingInline({
  assetMasters,
  excludeIds,
  onCreateAssetMaster,
  onAdd,
}: {
  assetMasters: AssetMasterOption[];
  excludeIds: Set<string>;
  onCreateAssetMaster: (data: {
    name: string;
    assetClass: string;
    currency: string;
    riskLevel: string;
  }) => Promise<AssetMasterOption>;
  onAdd: (assetMaster: AssetMasterOption) => void;
}) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium text-ink-muted hover:bg-surface-soft hover:text-ink"
      >
        <Plus size={15} />
        종목 추가
      </button>
    );
  }

  return (
    <AssetMasterPicker
      assetMasters={assetMasters}
      excludeIds={excludeIds}
      onCreate={onCreateAssetMaster}
      onPick={master => {
        onAdd(master);
        setOpen(false);
      }}
      onCancel={() => setOpen(false)}
    />
  );
}
```

- [ ] **Step 2: 패널에서 AddHoldingInline import + StepTable props 확장**

패널 상단에 import 추가:

```ts
import { AddHoldingInline } from './add-holding-inline';
```

`StepTable`의 props 타입에 세 가지를 추가하고 시그니처 구조분해에도 추가:

```ts
  assetMasters,
  onCreateAssetMaster,
  onAddAsset,
}: {
  step: InputStep;
  nextStep: InputStep | undefined;
  expandedAccounts: Set<string>;
  onToggleAccount: (accountId: string) => void;
  onUpdateRow: (rowKey: string, field: keyof EditableMonthlyRow, value: string | boolean) => void;
  onRemoveRow: (rowKey: string) => void;
  onNext: () => void;
  assetMasters: AssetMasterOption[];
  onCreateAssetMaster: (data: {
    name: string;
    assetClass: string;
    currency: string;
    riskLevel: string;
  }) => Promise<AssetMasterOption>;
  onAddAsset: (accountId: string, assetMaster: AssetMasterOption) => void;
}) {
```

- [ ] **Step 3: StepTable tbody에 "종목 추가" 행 렌더**

`StepTable`의 `<tbody>` 안. 단일계좌 분기(`isSingleAccount ? ...`)를 아래로 교체:

```tsx
{isSingleAccount ? (
  <>
    {step.rows.map(row => renderRow(row, true))}
    {step.accountGroups[0] && (
      <tr>
        <td colSpan={5} className="border-b border-hairline px-3 py-2">
          <AddHoldingInline
            assetMasters={assetMasters}
            excludeIds={new Set(step.rows.map(row => row.assetMasterId))}
            onCreateAssetMaster={onCreateAssetMaster}
            onAdd={master => onAddAsset(step.accountGroups[0].accountId, master)}
          />
        </td>
      </tr>
    )}
  </>
) : (
  step.accountGroups.map(group => {
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
                <span className="truncate text-xs text-ink-subtle">{group.institutionName}</span>
              </span>
              <span className="flex shrink-0 items-center gap-2 text-xs font-medium text-ink-subtle">
                {group.missingCount > 0 && (
                  <span className="rounded-full bg-goal/10 px-2 py-0.5 text-[11px] font-semibold text-goal">
                    {group.missingCount}
                  </span>
                )}
                <span>
                  {group.filledCount}/{group.rows.length} · {formatAmount(group.totalValue)}
                </span>
              </span>
            </button>
          </td>
        </tr>
        {isOpen && group.rows.map(row => renderRow(row, false))}
        {isOpen && (
          <tr>
            <td colSpan={5} className="border-b border-hairline px-3 py-2 pl-8">
              <AddHoldingInline
                assetMasters={assetMasters}
                excludeIds={new Set(group.rows.map(row => row.assetMasterId))}
                onCreateAssetMaster={onCreateAssetMaster}
                onAdd={master => onAddAsset(group.accountId, master)}
              />
            </td>
          </tr>
        )}
      </Fragment>
    );
  })
)}
```

> 위 블록은 기존 `isSingleAccount ? step.rows.map(...) : step.accountGroups.map(...)` 전체를 대체한다. 계좌 헤더 행 마크업은 기존과 동일하며 끝에 "종목 추가" 행만 더해졌다.

- [ ] **Step 4: 렌더 호출부에 새 props 전달**

패널 본문에서 `<StepTable ... />`를 렌더하는 곳에 props 추가:

```tsx
<StepTable
  key={step.key}
  step={step}
  nextStep={nextStep}
  expandedAccounts={expandedAccounts}
  onToggleAccount={toggleAccount}
  onUpdateRow={updateRow}
  onRemoveRow={rowKey => setRows(prev => prev.filter(item => item.rowKey !== rowKey))}
  onNext={() => nextStep && setActiveStepKey(nextStep.key)}
  assetMasters={assetMasters}
  onCreateAssetMaster={handleCreateAssetMaster}
  onAddAsset={addAssetToAccount}
/>
```

- [ ] **Step 5: 타입체크·린트**

Run: `pnpm exec tsc --noEmit && pnpm exec eslint src/components/features/asset/add-holding-inline.tsx src/components/features/asset/monthly-asset-input-panel.tsx`
Expected: 에러 없음.

- [ ] **Step 6: 커밋**

```bash
git add src/components/features/asset/add-holding-inline.tsx src/components/features/asset/monthly-asset-input-panel.tsx
git commit -m "feat(asset): 계좌 컨텍스트 인라인 '종목 추가'(A 흐름) 배선"
```

---

## Task 5: AddAccountFlow + 하단 평면 추가 UI 교체

**Files:**
- Create: `src/components/features/asset/add-account-flow.tsx`
- Modify: `src/components/features/asset/monthly-asset-input-panel.tsx`

- [ ] **Step 1: AddAccountFlow 구현**

`src/components/features/asset/add-account-flow.tsx`:

```tsx
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
  const [accountForm, setAccountForm] = useState({ name: '', accountType: ACCOUNT_TYPE[0] as string });
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
              value={newInstitution.name}
              onChange={event =>
                setNewInstitution(prev => ({ ...(prev as { name: string; type: string }), name: event.target.value }))
              }
            />
            <select
              className={`${inputClass} max-w-[120px]`}
              value={newInstitution.type}
              onChange={event =>
                setNewInstitution(prev => ({ ...(prev as { name: string; type: string }), type: event.target.value }))
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
            value={accountForm.name}
            onChange={event => setAccountForm(prev => ({ ...prev, name: event.target.value }))}
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-medium text-ink-subtle">계좌 종류</span>
          <select
            className={inputClass}
            value={accountForm.accountType}
            onChange={event => setAccountForm(prev => ({ ...prev, accountType: event.target.value }))}
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
```

- [ ] **Step 2: 패널 하단 평면 추가 UI를 AddAccountFlow로 교체**

패널 상단에 import 추가:

```ts
import { AddAccountFlow } from './add-account-flow';
```

패널 하단의 기존 추가 블록(`{draft && ( ... showNewHoldingRow ... )}` 전체 — 계좌/종목 select와 "자산 추가" 버튼 마크업)을 아래로 교체:

```tsx
{draft && (
  <div className="mt-4">
    <AddAccountFlow
      members={members}
      institutions={institutions}
      assetMasters={assetMasters}
      onCreateInstitution={handleCreateInstitution}
      onCreateAccount={handleCreateAccount}
      onCreateAssetMaster={handleCreateAssetMaster}
      onAddHolding={addAssetToAccount}
    />
  </div>
)}
```

- [ ] **Step 3: 죽은 코드 제거**

교체로 더 이상 쓰이지 않는 다음을 패널에서 삭제한다:
- `handleAddHolding` 함수 전체
- `newHolding` / `setNewHolding` state, `NewHoldingSelection` 인터페이스
- `showNewHoldingRow` / `setShowNewHoldingRow` state
- 그로 인해 미사용이 된 lucide import(예: `Plus`가 패널 본문에서 더 안 쓰이면 제거) — 린트가 알려준다.

- [ ] **Step 4: 타입체크·린트(미사용 정리 확인)**

Run: `pnpm exec tsc --noEmit && pnpm exec eslint src/components/features/asset/add-account-flow.tsx src/components/features/asset/monthly-asset-input-panel.tsx`
Expected: 에러·미사용 경고 0. (남으면 해당 import/심볼 제거 후 재실행.)

- [ ] **Step 5: 커밋**

```bash
git add src/components/features/asset/add-account-flow.tsx src/components/features/asset/monthly-asset-input-panel.tsx
git commit -m "feat(asset): 새 계좌·기관 드릴다운(AddAccountFlow)으로 하단 추가 UI 교체"
```

---

## Task 6: 문서화 + 전체 검증

**Files:**
- Modify: `docs/known-risks.md`, `docs/manual-checklist.md`, `docs/product/asset-management.md`, `docs/verification-log.md`

- [ ] **Step 1: 알려진 제약 추가**

`docs/known-risks.md`에 항목 추가(기존 형식에 맞춰):

> **빈 기관/계좌 잔존**: 자산 추가 드릴다운에서 "기관/계좌 만들기"는 즉시 영속된다. 첫 종목을 넣지 않고 이탈하면 보유가 없는 빈 기관·계좌가 남을 수 있다(트리에는 안 보임). 기준 데이터 관리 화면(M006 백로그)에서 정리 예정.

- [ ] **Step 2: 수동 체크리스트 추가**

`docs/manual-checklist.md`에 항목 추가:

```markdown
### 자산 입력 — 추가 흐름
- [ ] A: 계좌 그룹/단일계좌 스텝의 "종목 추가" → 기존 종목 선택 시 그 계좌에 행 추가, 해당 스텝/계좌로 포커스.
- [ ] A: "+ 새 종목"으로 미존재 종목 생성 → 즉시 목록 반영 후 행 추가.
- [ ] B/C: 하단 "계좌·기관 추가" → 소유자·기관(또는 +새 기관)·계좌 생성 → 첫 종목 추가 → 새 계좌가 트리에 등장.
- [ ] 같은 계좌에 동일 종목 재추가 시 목록에서 제외되어 중복 불가.
- [ ] 추가한 행의 평가액 입력 후 "업로드" → 스냅샷 저장 확인.
```

- [ ] **Step 3: 설계 문서 보강(docs/product)**

`docs/product/asset-management.md`의 "입력 화면 구조: 소유자 ▸ 기관 스텝" 절 끝에 추가:

```markdown
#### 자산/계좌/기관 추가

- **종목 추가(흔함)**: 각 계좌 그룹/단일계좌 스텝의 "종목 추가"에서 기존 종목 선택 또는 새 종목 생성. 계좌는 컨텍스트로 정해져 선택 불필요.
- **계좌·기관 추가(가끔)**: 패널 하단 "계좌·기관 추가"에서 소유자 → 기관(선택/＋신규) → 계좌(신규) → 첫 종목 순으로 진행. 기관/계좌/종목은 즉시 저장되고, 보유 행 평가액은 업로드 시 스냅샷으로 확정한다.
- 소유자(Member)는 생성하지 않고 기존 목록에서 선택만 한다.
```

- [ ] **Step 4: 전체 검증 실행**

```bash
pnpm exec tsc --noEmit
pnpm lint
pnpm test
NEXT_TURBOPACK_EXPERIMENTAL_USE_SYSTEM_TLS_CERTS=1 pnpm build
```
Expected: tsc 0 에러, lint 0, vitest 전체 통과(신규 6 테스트 포함), build 전 라우트 컴파일(`/asset/monthly` 포함).

- [ ] **Step 5: 검증 로그 기록**

`docs/verification-log.md` 최상단 데이터 행에 추가(형식 일치):

```
| 2026-06-05       | 자산 추가 흐름 인라인 생성        | `pnpm exec tsc --noEmit` / `pnpm lint` / `pnpm test` / `build` | Pass | 계좌 컨텍스트 종목추가(A)+새 계좌/기관 드릴다운(B·C), 기준데이터 즉시 생성·refetch, AssetMasterPicker/AddHoldingInline/AddAccountFlow 분리, buildNewHoldingRow 단위테스트. Vitest 8 files |
```

- [ ] **Step 6: 커밋**

```bash
git add docs/known-risks.md docs/manual-checklist.md docs/product/asset-management.md docs/verification-log.md
git commit -m "docs(asset): 자산 추가 인라인 생성 흐름 문서화·검증 로그"
```

---

## Self-Review (작성자 점검 결과)

- **스펙 커버리지**: A 흐름(Task 4), B·C 흐름(Task 5), 인라인 생성(Task 2 핸들러 + Task 3 picker), 빈 계좌→첫 종목 연결(Task 5 holding stage), 컴포넌트 분리(Task 1·3·4·5), 데이터 영속 시점(Task 2), 에러 처리(각 컴포넌트 try/catch + 중복 가드), 통화 미입력(AddAccountFlow 계좌 폼에 currency 없음) — 모두 태스크에 매핑됨.
- **플레이스홀더**: 없음(모든 코드 블록 완성).
- **타입 일관성**: `buildNewHoldingRow` 시그니처(account/institution/assetMaster)가 Task 2 `addAssetToAccount` 호출과 일치. `AssetMasterOption`/`AccountOption`/`InstitutionOption`/`MemberOption`는 `@/components/features/asset-transaction/types`의 기존 정의 사용. `createAccount`는 `{id}`만 신뢰하고 refetch 후 `AccountOption` 조회로 `memberName` 확보(생성 응답에 조인 필드 부재 대비).
- **YAGNI**: 관리 화면/수정·삭제/Member 생성 제외(범위 밖).
