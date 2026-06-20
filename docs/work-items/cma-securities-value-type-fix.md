# CMA 보유 증권 value형 오분류 수정

최종 갱신: 2026-06-15 00:30

## Summary

- 태스크 ID: `20260615-cma-securities-value-type-fix`
- 관련 마일스톤: M009(투자 수익 현황·인사이트)와 연관, 단독 수행 가능
- Worktree: 선택(권장 — Prisma 데이터 재백필 + 공유 SSOT 로직 변경이라 격리)
- Branch: `task/asset-cma-input-type-fix`
- Owner: 미정
- Status: `Planned`

## Goal

- 목표: 증권(주식/채권/금/코인)이 CMA·예금성 계좌에 들어 있을 때 현금성(value형)으로 오분류되어 평가손익이 0·수익률 —로 고정되는 문제를 해소한다. 입력 유형을 **계좌타입이 아닌 자산군**이 결정하도록 바로잡는다.
- 성공 기준:
  - CMA 계좌의 증권 26개(주식 KRW 9 + 주식 USD 15 + 채권 USD 2)가 수량형으로 분류되어 `평가손익 = 평가액 − 원금`이 실제로 계산된다(엔비디아·팔란티어·QQQM 등).
  - `/asset/profit`에서 이들 외화 종목에 이번에 구현한 통화 표시(원통화 우선 + 원화 보조)·환율 열이 실제로 노출된다.
  - 진짜 현금성(`예금` 자산군: 정기예금·외화예금)은 그대로 value형 유지.
  - `pnpm lint`·`tsc`·`test` 통과 + dev.db 백필로 손익 비0 확인.

## 배경: 근본 원인 (진단 완료 2026-06-15)

- `src/lib/asset-input-type.ts`의 `getAssetInputType`가 **계좌타입을 자산군보다 우선**한다:
  ```js
  if ( assetClass.includes('예금') || ... || accountType.toUpperCase().includes('CMA') ) return 'value';
  ```
  → `자산군=주식`이어도 `계좌타입=CMA`면 value형으로 강제됨. CMA 계좌는 현금(외화예금)과 증권을 함께 담을 수 있는데 분류기가 "CMA=현금성"으로 단정.
- 영향: value형이면 `toProfitRow`가 `원금=평가액`으로 강제 → 평가손익 0·수익률 null 고정, 기본 화면 숨김, 평균단가 자동 파생 제외. 즉 26개 증권(원화 9 포함)의 투자 손익이 전혀 계산되지 않음. 통화 표시 미노출은 그 한 증상.
- 데이터는 정상: 계좌는 실제 CMA가 맞고, 수량도 실제 주수(엔비디아 3~12, 팔란티어 4~20 등). `quantity=1` 고정은 3개(DHY·HD현대중공업·노타, 단주/소액)뿐 → 재임포트 불필요.

## Scope

- In scope:
  - `getAssetInputType` 분류 규칙을 자산군 우선으로 수정.
  - 관련 테스트 갱신/추가.
  - dev.db 데이터 재백필(`pnpm db:backfill-avgcost`)로 원가·손익 복원.
  - 관련 문서 동기화.
- Out of scope:
  - 임포터(`read-xlsx-asset.ts`) 변경 — 수량 데이터는 정상이라 불필요(분류만 문제).
  - 통화 표시 UI(이미 완료된 별건).
  - Prisma 스키마 변경 없음.
- 예상 수정 영역:
  - `src/lib/asset-input-type.ts` (핵심 1파일)
  - `src/components/features/asset/__tests__/monthly-input-row.test.ts`
  - `src/services/__tests__/holding-service.test.ts`
  - (신규) `src/lib/__tests__/asset-input-type.test.ts`
  - FR-C5 분해 테스트(`change-breakdown`/시나리오) — 기대값 재검토
- 충돌 주의 영역: `holding-service.ts`(여러 인사이트가 `isValueTypeHolding` 공유), dev.db(재백필) — 다른 자산 작업과 동시 진행 금지.

## 구현 계획

### 1. 분류 규칙 수정 — `src/lib/asset-input-type.ts`
자산군 우선으로 판정. 증권은 계좌와 무관하게 수량형, `예금/현금` 자산군만 value형. 계좌타입 기반은 자산군 불명 시 보조로만.
```ts
export function getAssetInputType(assetClass: string, accountType: string): 'value' | 'quantity' {
  // 입력 유형은 자산군이 결정한다. CMA·예금 계좌는 현금과 증권을 함께 담을 수 있어,
  // 계좌타입을 우선하면 CMA 보유 주식이 현금성으로 오분류된다(자산군 우선).
  if (assetClass.includes('예금') || assetClass.includes('현금')) return 'value';
  if (['주식', '채권', '금', '코인'].some(t => assetClass.includes(t))) return 'quantity';
  // 자산군 불명 시에만 계좌타입 보조 판정(기존 동작 유지)
  const lowerAccountType = accountType.toLowerCase();
  if (
    accountType.includes('예금') ||
    accountType.includes('적금') ||
    accountType.toUpperCase().includes('CMA') ||
    ['deposit', 'savings', 'time_deposit', 'cma', 'cash'].includes(lowerAccountType)
  ) {
    return 'value';
  }
  return 'quantity';
}
```
- 참고: `AssetClass` SSOT는 `주식|채권|예금|금|코인`(5종)이라 실데이터는 모두 앞의 두 분기에서 결정됨. 뒷 폴백은 방어용.

### 2. 테스트
- `monthly-input-row.test.ts` — **기존 "예금류 계좌는 value형" 케이스(L50–59)가 버그를 인코딩**하고 있음(증권의 *계좌*를 예금으로 바꿔 value 기대). 수정 후엔 quantity가 맞으므로:
  - value형 기대는 자산군을 `예금`(진짜 현금성)으로 바꾼 케이스로 교체.
  - 회귀 가드: `자산군=주식 + 계좌=CMA → quantity` 케이스 추가.
- `holding-service.test.ts` (`getMonthlyProfitData`) — `주식/USD + CMA` 행을 추가해 `valueType:false`·`gain != 0`·`avgCostOriginal` 노출을 단언(정확히 이 버그를 잡는 회귀).
- 신규 `src/lib/__tests__/asset-input-type.test.ts` — 매트릭스: 주식+CMA→quantity, 채권+CMA→quantity, 금+IRP→quantity, 코인+코인→quantity, 예금+CMA→value, 예금+예금→value, 예금+종합→value.
- FR-C5 분해 테스트 — 26개가 시장/매매 효과에 새로 포함되므로 기대값이 바뀜. 실패 시 정확한 신규 기대값으로 갱신(수치 검산 동반).

### 3. 데이터 마이그레이션
- 코드 수정 후 `pnpm db:backfill-avgcost` 실행 → 지금까지 건너뛰던 26개를 수량형으로 재파생. `backfillAvgCostKRW`는 `avgCostKRW`와 `avgCostOriginal`(외화)을 함께 갱신함(L34–35).
- 한계(문서화된 동작): 평단 시작점 = 각 보유 최초 스냅샷의 현재가 → 초기 월 손익≈0, 이후 수량 변화로 누적. 사용자가 직접 보정 가능.
- 대안: `pnpm db:reset` + 재로드(시드 끝에서 백필 자동 호출)도 동일 결과. 단, 백필 단독이 덜 파괴적이라 우선.
- 주의: 사용자 dev.db를 직접 만지므로 실행 전 백업 권장(`cp prisma/dev.db prisma/dev.db.bak`).

## Verification

- 우선 실행: `pnpm lint`, `pnpm exec tsc --noEmit`
- 완료 전 실행: `pnpm test`(분류/수익/분해 테스트 포함)
- 데이터 확인: 백필 후 `/api/asset/profit?year=2026&month=1`에서 엔비디아·팔란티어 등 `valueType:false`·`gain != 0`·`avgCostOriginal` 채워짐 확인. CMA 외화 종목이 기본 화면에 노출되고 통화 표시·환율 열이 보이는지 SSR/수동 확인.
- 회귀: 정기예금·외화예금은 여전히 value형(`gain:0`, 평균단가/현재가 —).
- 수동: `docs/manual-checklist.md` 자산 입력(이들 행이 수량+가격 입력으로 펼쳐지는지)·투자 수익 화면.

## 영향 범위 (blast radius)

- 월별 입력 UI: 26개 행이 수량형(펼침, `quantityInput` 더 이상 '1' 고정 아님). 기존 스냅샷에 실제 수량 있어 편집 정상.
- FR-C1 투자 수익: 손익 계산·기본 노출·평균단가 자동 파생·통화 표시 활성화.
- FR-C5 저축/시장 분해: 26개가 시장/매매 효과에 포함 → 수치 변화(정확도 향상).
- 자산 총액·위험자산 비중: value/quantity 무관하게 평가액은 동일 → 총액 불변, 손익 기반 인사이트만 변화.

## 후속 문서 갱신 (구현 시)
- `docs/product/insights.md`·`asset-management.md`: 입력 유형 판정 규칙(자산군 우선) 명시.
- `docs/product/data-model.md`: CMA에 증권 보유 가능·입력 유형 결정 기준 주석.
- `docs/known-risks.md`: 본 오분류를 위험으로 추가했다면 해소 후 제거/이력화.
- `docs/verification-log.md`: 검증 결과 1줄.

## Progress Log

| 일시 | 내용 | 검증 |
|------|------|------|
| 2026-06-15 00:30 | 진단 완료 후 수정 계획 수립(코드 미변경) | 없음 |

## Completion Notes

- 변경 요약: (구현 시 작성)
- 남은 후속 작업: (구현 시 작성)
- 통합 시 주의점: dev.db 재백필 필요 — 데이터 변경 동반 작업과 직렬화.
