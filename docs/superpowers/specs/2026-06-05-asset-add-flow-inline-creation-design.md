# 자산 추가 흐름 재설계 — 위계 기반 인라인 생성

작성일: 2026-06-05
대상 화면: 월별 자산 입력 패널 (`src/components/features/asset/monthly-asset-input-panel.tsx`)

## Context (왜)

월별 자산 입력 패널의 "자산 추가"가 불편하다. 현재는 패널 하단의 **평면 드롭다운**(계좌 선택 → 종목 선택 → 추가)으로, 입력 화면이 `소유자 ▸ 기관 스텝 ▸ 계좌 그룹 ▸ 종목` 위계로 재편된 것과 따로 논다. 또 기관/계좌/종목을 **새로 만드는** 경로가 입력 흐름 안에 없어, 새 계좌·종목이 생기면 막힌다(기준 데이터 관리 화면은 미구현).

목표: 추가 동작을 화면의 위계(기관 ▸ 계좌 ▸ 자산)에 맞춰 자연스럽게 끼워 넣고, 가끔 필요한 새 기관·계좌 생성을 **입력 흐름을 떠나지 않고** 인라인으로 처리한다.

빈도 프로필(사용자 확인): **A(기존 계좌에 새 종목)가 주**, **B(새 계좌)·C(새 기관)는 가끔**.

## 현재 상태 (기준)

- 추가 UI: `showNewHoldingRow` + `newHolding {accountId, assetMasterId}` + `handleAddHolding`. 기존 계좌·종목 조합만 선택해 인메모리 `EditableMonthlyRow`(isNew, holdingId=null) 추가. 평가액은 "업로드"(`saveMonthlyInput`) 시 스냅샷으로 확정.
- 생성 백엔드: `apiClient.asset.createInstitution / createAccount / createAssetMaster` + 서비스/POST 라우트 **이미 존재**. **Member 생성 API는 없음**(가족 고정).
- 기준 데이터 관리 화면: 미구현(목업 `docs/product/design/views-manage.jsx` `BaseDataView`만).
- 트리(sections/steps/accountGroups)는 `rows`(스냅샷·보유 파생)에서 빌드 → **보유 행이 없는 빈 계좌는 트리에 안 보인다.**

## 설계

채택: **하이브리드** — 흔한 A는 계좌 컨텍스트 인라인, 가끔의 B·C는 가이드 드릴다운 하나로.

### 흐름 A — 계좌 컨텍스트 "+ 종목 추가"

- 각 계좌 그룹(펼친 상태) 하단, 단일계좌 스텝은 표 하단에 "+ 종목 추가" 진입점.
- 계좌가 컨텍스트로 정해져 있으므로 **계좌 선택 생략**. 종목만 선택/생성:
  - "종목 선택" 목록 = 그 계좌에 아직 없는 기존 `AssetMaster`(긴 목록 대비 가벼운 텍스트 필터 허용).
  - 목록에 없으면 "+ 새 종목" → 인라인 폼(종목명, 자산군 `assetClass`, 통화 `currency`, 위험구분 `riskLevel`) → `createAssetMaster`(즉시 DB) → 반환 id로 이어서 행 추가.
- 추가된 행은 그 계좌 그룹에 즉시 표시. 평가액은 기존처럼 업로드 시 스냅샷 확정.

### 흐름 B·C — "+ 계좌·기관 추가" 가이드 드릴다운

- 패널 하단 **단일 진입 버튼**. 드릴다운: 소유자 → 기관(선택/＋신규) → 계좌(신규).
  1. 소유자(Member) — 기존 목록에서 **선택만**(생성 API 없음).
  2. 기관 — 선택, 또는 "+ 새 기관"(기관명, 유형 bank/brokerage) → `createInstitution`(즉시 DB).
  3. 계좌 — 계좌명, 종류 `accountType` → `createAccount`(memberId+institutionId, 즉시 DB). **통화 입력 없음**: `createAccountSchema`는 currency를 받지 않고 `Account.currency`는 `@default("KRW")`다. 종목 통화는 `AssetMaster`가 가지므로 계좌 통화는 입력 대상이 아니다.
- 빈 계좌는 트리에 안 보이므로, **생성 직후 A 흐름으로 연결**해 첫 종목을 넣어 트리에 등장시킨다. 생성 직후 `activeStepKey`·`expandedAccounts`를 새 계좌로 포커스해 "+ 종목 추가"를 연다.

### 컴포넌트 구조 (패널 비대화 방지)

- **`AddHoldingInline`** (A) — props: 계좌 컨텍스트(accountId·memberName·institutionName·institutionType·accountName·accountType·currency 기본값 등), 그 계좌에 없는 종목 목록, `onCreateAssetMaster`, `onAddRow(assetMaster)`.
- **`AddAccountFlow`** (B·C) — props: members·institutions·accounts, `onCreateInstitution`, `onCreateAccount`, `onAccountReady(account)`.
- 패널은 목록 state·행 변경만 보유하고 콜백 전달. 기존 `handleAddHolding`을 **`addHoldingRow(account, assetMaster)` 순수 빌더**로 리팩터해 두 흐름이 공유(`institutionType` 포함, 기존 `getInputType` 재사용).

### 데이터 흐름 (영속 시점)

- 기준 데이터(기관/계좌/종목): `apiClient.create*`로 **즉시 DB 저장** → 성공 시 해당 목록 refetch(드롭다운·트리 lookup 정합: institutionType, memberName).
- 보유 행: 인메모리 `EditableMonthlyRow`(isNew) → "업로드" 시 스냅샷 확정. **기존 경로 변경 없음.**

### 에러 처리 / 엣지

- 같은 계좌에 동일 종목 중복 → 인라인 경고(기존 alert를 인라인 메시지로 대체).
- 생성 폼: 필수값 충족 전 "만들기" 비활성. API 실패 → 폼 유지 + 인라인 에러, 행 미추가.
- 유니크 충돌(기관명 unique, 종목 `@@unique([name,currency])`) → API 에러 메시지 노출.
- "기관 만들기"는 즉시 영속 → 계좌 안 만들고 이탈 시 **빈 기관**이 남을 수 있음(경미). `docs/known-risks.md`에 기록, 후속 관리 화면에서 정리.

## 범위 밖 (YAGNI)

- 기준 데이터 **전용 관리 화면**(BaseDataView), 수정/삭제 UI — 별도 작업(M006 백로그).
- Member 생성, 기관/계좌/종목 수정·비활성화.
- 콤보박스 라이브러리 도입 — 네이티브 select + 가벼운 필터로 충분.

## 검증

- `pnpm exec tsc --noEmit` / `pnpm lint` / `pnpm test`(기존 서비스·API 테스트 재사용).
- `addHoldingRow` 순수 빌더 분리 시 단위 테스트 1개 추가(계좌+종목 → 올바른 행, institutionType·inputType 포함).
- 화면 동작은 `docs/manual-checklist.md`에 A/B·C 흐름 항목 추가해 수동 확인.

## 영향 파일 (예상)

- `src/components/features/asset/monthly-asset-input-panel.tsx` (추가 UI 교체, `addHoldingRow` 리팩터)
- `src/components/features/asset/add-holding-inline.tsx` (신규)
- `src/components/features/asset/add-account-flow.tsx` (신규)
- 문서: `docs/known-risks.md`, `docs/manual-checklist.md`, `docs/product/asset-management.md`(추가 흐름 절)
