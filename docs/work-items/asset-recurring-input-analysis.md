# 자산 관리 반복 입력 진단 + 개선 방향

최종 갱신: 2026-06-04

## Summary

- 태스크 ID: `20260604-asset-recurring-input-analysis`
- 관련 마일스톤: M006(자산 데이터 안정화), M009(IA 재편·신규 인사이트)
- Worktree: 없음 (문서 분석)
- Branch: `main`
- Owner: 분석 세션
- Status: `In Progress`
- 성격: 진단 + 개선 방향 제안 문서. 구현은 본 문서의 "열린 결정"이 확정된 뒤 별도 태스크로 진행한다.

## Goal

- 목표: 자산 관리의 ① 반복 입력 편의성, ② 입력 폼 UX, ③ 프로젝트 목적 명확성에 대한 모호성을 진단하고, 개선 방향을 제안한다.
- 성공 기준: 진단(A~D)·개선 방향(1~4)·열린 결정이 근거 경로와 함께 정리되어, 목표 모델 확정을 위한 의사결정 자료로 쓸 수 있다.

## 인터뷰 확정 사항 (배경)

- 산출물: **진단 + 개선 방향 제안** (구현은 이후 별도 작업).
- 입력 주기: **월말 기본 + 주 단위 입력 확장성 필요**. ← 디자인의 "월 1회" 전제와 충돌하는 신규 제약.
- 목표 모델: 디자인-코드 격차를 어느 쪽으로 통일할지는 **이 분석으로 판단**(열린 결정).

근본 문제: **디자인 SSOT(`docs/product/`)와 실제 구현 코드가 서로 다른 자산 모델을 따르며, 둘 다 사용자의 "주 단위 확장성" 니즈와 어긋난다.** 이 격차가 입력 편의성·폼 UX·목적 명확성 문제의 공통 뿌리다.

---

## 진단

### A. 모델 격차 (가장 큰 모호성)

디자인은 단순화를 위해 일자 granularity를 버렸으나, 그게 주 단위 확장성과 충돌한다. 코드는 일자 기반이라 주 단위에 더 가깝지만, 디자인이 없애려던 거래/가격/계좌 스냅샷 하이브리드를 아직 안고 있다.

| 축 | 디자인 SSOT (`docs/product/data-model.md`) | 구현 코드 (`prisma/schema.prisma`) | 사용자 니즈 |
|---|---|---|---|
| 스냅샷 키 | `HoldingSnapshot.yearMonth` 문자열("2024-12") — **월 전용**, "일자 모호성 제거" 명시(L157) | `HoldingValueSnapshot.date` DateTime, `@@unique([holdingId, date])`(schema L209·L224) — 일자 기반 | 월 + **주** 단위 |
| 현금/종목 분리 | `CashSnapshot`(월별 현금 SSOT) + `HoldingSnapshot` 분리 | `HoldingValueSnapshot` 1종 + `Account.cashBalance`(현재값만, L135) + `AccountSnapshot`(L154, `@@unique([accountId, date])`) | — |
| 거래 기록 | `HoldingTransaction` **폐기**(ADR, `asset-management.md` L85–103) | `HoldingTransaction` 사용(L188) + `/asset/transactions` 화면·API(`[id]` 수정 포함) | 불필요(스냅샷이면 충분) |
| 가격 이력 | `AssetPrice` 폐기 → 스냅샷에 통합 | `AssetPrice` 별도 존재(L107) | — |

핵심 긴장 요약:
- 디자인의 `yearMonth` 키는 "월 단위" 의미를 모델에 못박아 **주 단위 입력을 구조적으로 막는다**.
- 코드의 `date` 키는 주 단위를 수용할 수 있으나, 거래·가격·계좌 스냅샷이 스냅샷과 병존해 "어느 값이 진실인가"가 불명확하다.

### B. 반복 입력 편의성

- 강점:
  - 전월 스냅샷 자동 복사 — `holdingValueSnapshotService.getMonthlyInputDraft` (`src/services/holding-service.ts:657`). 전월/당월 병합 초안 반환.
  - localStorage 임시저장, 인라인 기관/계좌/종목 생성, 키보드 네비게이션(Tab/Enter), 실시간 자동 계산.
- 문제:
  1. 월말 기준일 고정 — `getMonthEndSnapshotDate` (`src/services/holding-service.ts:497`). 주 단위·임의 시점 입력 진입점이 없다.
  2. 미입력 자산 경고가 개수만 표시 → 어떤 자산인지 위로 스크롤해 확인해야 한다.
  3. 신규 자산 추가 시 assetClass/riskLevel/currency만 받고 subClass/symbol 등은 누락.
  4. 스냅샷(`HoldingValueSnapshot`)과 거래(`HoldingTransaction`)가 동시 존재할 때 신뢰 우선순위 정책이 없다(`Holding.dataSource`만으로 구분, 혼합 케이스 미정의).

### C. 입력 폼 UX

- 월별 입력 패널 — `src/components/features/asset/monthly-asset-input-panel.tsx`:
  - 모달 + 테이블 구조는 데스크톱에서 효율적이나 모바일 대응이 약하다.
  - 전월 대비 증감액은 있으나 변화율(%)이 없다.
  - currency가 KRW인 종목에도 환율 필드가 노출되어 혼동을 준다.
- 거래 입력 행 — `src/components/features/asset-transaction/holding-transaction-input-row.tsx`:
  - 13개+ 컬럼 수평 스크롤 → 모바일에서 사실상 사용 불가.
  - ADR("거래 기록 미사용")과 모순되는 화면이 살아 있다.

### D. 프로젝트 목적 명확성

- 문서상 목적은 명확: `docs/product/prd.md` 기준 "가족 월말 자산 스냅샷 + 투자 수익/자산 증가 분해 인사이트".
- 그러나 인지된 모호성:
  1. 디자인-코드 모델 격차(진단 A).
  2. `/asset/transactions` 존재 ↔ ADR "거래 미사용" 모순.
  3. 가계부 내비 통합 위치 미정(M009 ADR 미정).
  4. 입력 주기 전제(월 1회) ↔ 실제 니즈(주 단위) 불일치.

---

## 개선 방향 제안

### 1. 목표 모델 단일화 — 스냅샷 전용 + 일자/주기 키 (채택)

- ADR의 "단일 SSOT · 파생값 비저장" 단순성은 **채택**한다.
- 단, 디자인의 월 전용 `yearMonth`를 **일자 기반 `snapshotDate`(또는 period) 키로 일반화**해 주 단위 확장성을 확보한다.
- 결과적으로 현재 코드의 date 기반 `HoldingValueSnapshot`에 더 가까운 모델. `HoldingTransaction` / `/asset/transactions`는 결정 4에 따라 **제거하지 않고 비권위로 격리**한다(아래 "결정 1 ↔ 4 긴장" 참조). `AssetPrice` / `AccountSnapshot`는 스냅샷 모델로 흡수 가능한지 별도 검토.
- 디자인 우선 원칙(CLAUDE.md)에 따라 **먼저 `docs/product/data-model.md`의 `yearMonth` 항목과 `asset-management.md` ADR의 "월 1회" 전제·"거래 미사용" 단정을 개정**한 뒤 코드를 맞춘다(거래 화면 유지 결정을 ADR에 반영).
- 트레이드오프: 거래 기반 실현손익 자동 추적은 표준 흐름에서 포기. 대신 단일 진실원천과 주 단위 확장성을 동시에 확보.

### 2. 입력 주기 정책 명문화

- "월말 정기 마감 + 임의 시점(주 단위) 추가 스냅샷 허용"을 `prd.md` / `asset-management.md`에 명시.
- 기본 진입은 월말, 확장으로 임의 일자(주 단위) 스냅샷 선택.

### 3. 입력 편의성 개선

- 스냅샷 기준일 선택 UI(월말 고정 해제).
- 미입력 자산 sticky 목록(스크롤 없이 잔여 항목 확인).
- 신규 자산 추가 폼 필드 보강(subClass/symbol 등 선택 입력).
- 전월 대비 변화율(%) 표시.

### 4. 폼 UX 개선

- 모바일 카드형 또는 2단계 입력(기본정보 → 가격) 검토.
- currency 기반 환율 필드 조건부 노출(`inputType` 분기 방식과 동일하게).

---

## 확정된 결정 (2026-06-04)

1. **목표 모델**: 스냅샷 전용 + 일자/주기 키 방식으로 통일. 진실원천(SSOT)은 스냅샷이며, 모든 지표는 파생 계산.
2. **가계부 내비 위치**: 별도 최상위 그룹으로 둔다(기록 그룹에 통합하지 않음).
3. **환율 입력**: 사용자 수동 입력 유지(외부 API 미사용).
4. **거래 화면**: `/asset/transactions`는 향후 재도입 가능성을 고려해 **일단 유지**한다. 즉시 제거하지 않는다.

### 결정 1 ↔ 4 긴장과 처리 정책 (중요)

ADR이 `HoldingTransaction`을 폐기한 본래 이유는 "스냅샷과 거래 두 체계가 어긋나기 때문"이다. 거래 화면을 유지(결정 4)하면서 스냅샷을 SSOT로 삼으면(결정 1) 그 위험이 재발할 수 있다. 따라서 구현 시 다음을 전제로 한다:

- 스냅샷이 **유일한 진실원천**이다. 모든 평가액·원금·수익 지표는 스냅샷에서 파생한다.
- 거래(`HoldingTransaction`)와 `/asset/transactions` 화면은 **비권위(non-authoritative)로 격리**한다. 거래 입력이 `Holding`의 현재 상태나 스냅샷 값을 자동으로 덮어쓰지 않도록 한다(현재는 거래가 `Holding.quantity/averageCostKRW`를 재계산함 → 이 연결을 끊거나 스냅샷 우선으로 재정의).
- 거래 화면은 보조/참고용으로 남기되, 재도입 시 "스냅샷 보조 입력" 또는 "거래 → 스냅샷 반영" 방향을 검토한다.
- `AssetPrice` / `AccountSnapshot`는 스냅샷 모델로 흡수 가능한지 별도 검토(현금은 `CashSnapshot` 또는 종목 스냅샷과 동일 키 체계로 통합).

## 다음 단계 (결정 확정됨 → 구현 준비)

- 디자인 문서 개정(디자인 우선): `docs/product/data-model.md`(`yearMonth` → `snapshotDate`/period, `AssetPrice`·`AccountSnapshot` 처리), `docs/product/asset-management.md`(ADR에 "거래 화면 비권위 유지", "월말 + 주 단위" 입력 주기 명시).
- M006: 기준 데이터 수정/삭제 정책·UI, 스냅샷-거래 격리(거래가 `Holding` 상태를 덮어쓰지 않도록) 정합성 처리.
- M009: 가계부를 별도 최상위 그룹으로 두는 IA, 신규 인사이트 화면(투자 수익 현황·자산 증가 분해) 설계 반영.
- 환율은 수동 입력 유지 → 관련 자동 연동 검토 항목은 닫는다.

## 범위 / 제외

- In scope: 자산 관리(월별 스냅샷 입력 패널 + 거래 입력 화면)의 진단·개선 방향 문서화.
- Out of scope: 코드 변경, Prisma schema 마이그레이션, `docs/product/` 본 개정. 가계부 입력 흐름은 자산과 맞닿는 부분만 언급.

## Verification

- 문서 작업이므로 빌드/테스트 불필요(CLAUDE.md 검증 규칙).
- 인용 경로 점검 완료(2026-06-04): `prisma/schema.prisma`(L107/L135/L154/L188/L209/L224), `src/services/holding-service.ts`(L497/L657/L711), `src/components/features/asset/monthly-asset-input-panel.tsx`, `src/components/features/asset-transaction/holding-transaction-input-row.tsx`, `src/app/(app)/asset/transactions/page.tsx`, `docs/product/data-model.md`, `docs/product/asset-management.md`.

## Progress Log

| 일시 | 내용 | 검증 |
|------|------|------|
| 2026-06-04 | 코드·디자인 탐색, 인터뷰로 제약 확정, 진단 문서 작성 | 인용 경로 grep 확인 |
| 2026-06-04 | 열린 결정 4건 확정(스냅샷 전용+일자키 / 가계부 별도 그룹 / 환율 수동 / 거래 화면 유지), 결정 1↔4 격리 정책 추가 | — |
| 2026-06-04 | 디자인 문서 개정: `data-model.md`(yearMonth→snapshotDate, 폐기/유지 모델 재정리), `asset-management.md`(ADR 개정·워크플로 일반화), `prd.md`·`README.md` 정합화 | grep로 잔여 모순 확인 |
| 2026-06-04 | M006 increment 1 구현: 거래 비권위 격리 + 스냅샷→Holding.quantity 동기화 (TDD) | tsc/lint/test(46) Pass |
| 2026-06-04 | M006 incr 2 불필요 확인(라이브 이미 스냅샷 기반), incr 3a 구현: 스냅샷 avgCostKRW 추가·평균단가 동기화 (TDD) | tsc/lint/test(47)/db push Pass |
| 2026-06-04 | M006 incr 3b 구현: 월별 입력 패널에 평균단가(원화) 필드 추가, 편집 round-trip | tsc/lint/test(47)/build Pass |
| 2026-06-04 | M006 incr 3c 정리: 죽은 AssetPrice/AccountSnapshot 모델·함수·타입 제거, 테이블 drop | tsc/lint/test(46)/build Pass |
