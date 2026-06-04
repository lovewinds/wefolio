# 스키마 설계 가이드

WeFolio 데이터 모델의 설계 원칙과 사용 지침을 정리한 문서입니다.

> **2026-06-04 모델 방향 변경**: 자산 도메인은 **스냅샷을 단일 진실원천(SSOT)** 으로 삼는다.
> `HoldingValueSnapshot`이 보유 종목의 현재 상태를 결정하며(키는 일자 기준 `date` — 월말 기본, 주 단위 등 임의 시점 허용), 평균단가는 `avgCostKRW` 컬럼에 담는다.
> `HoldingTransaction`/거래 화면은 **비권위 보조**로만 유지하고 `Holding`을 자동으로 갱신하지 않는다.
> `AssetPrice`/`AccountSnapshot`은 현재 프로덕션 미사용(죽은 코드)이다.
> 설계 기준(SSOT)은 `docs-new/data-model.md`·`docs-new/asset-management.md`이며, 배경은 `docs/work-items/asset-recurring-input-analysis.md` 참조.

---

## 도메인 분리 원칙

### 가계부와 자산 관리는 연결하지 않음

두 도메인은 독립적으로 운영됩니다:

| 도메인 | 모델 | 용도 |
|--------|------|------|
| 가계부 | `BudgetTransaction`, `BudgetCategory` | 수입/지출 기록 |
| 자산 관리 | `Account`, `Holding`, `HoldingTransaction` | 자산 현황 추적 |

연결하지 않는 이유:
- 가계부는 단순 기록 용도
- 자산 관리는 포트폴리오 분석 용도
- 두 도메인 간 통합 분석 불필요

---

## 자산-계좌 관계 구조

### 동일 종목의 다중 계좌 보유

같은 종목을 여러 계좌에서 보유할 수 있습니다:

```
AssetMaster (삼성전자)
│
├── Holding (삼성증권 계좌)
│   ├── quantity: 5, averageCostKRW: 100,000
│   ├── HoldingTransaction (매수/매도 기록)
│   └── HoldingValueSnapshot (월별 스냅샷)
│
└── Holding (메리츠증권 계좌)
    ├── quantity: 5, averageCostKRW: 100,100
    ├── HoldingTransaction (매수/매도 기록)
    └── HoldingValueSnapshot (월별 스냅샷)
```

### 핵심 제약조건

```prisma
// 계좌별 종목은 하나의 Holding만 존재
@@unique([accountId, assetMasterId])

// 계좌별 종목별 날짜는 하나의 스냅샷만 존재
@@unique([holdingId, date])

// 계좌별 날짜는 하나의 스냅샷만 존재
@@unique([accountId, date])
```

### 사용자 레벨 집계

개별 Holding은 계좌별로 분리 관리되며, 사용자 레벨 집계(총 보유량, 평균단가)는 서비스 계층에서 계산합니다:

```typescript
// 예: 삼성전자 전체 보유 현황
const holdings = await holdingService.getByAssetMasterId(삼성전자ID);
// → 삼성증권: 5주, 메리츠증권: 5주

// 집계 계산
const totalQuantity = holdings.reduce((sum, h) => sum + h.quantity, 0);  // 10주
const avgCost = holdings.reduce((sum, h) => sum + h.quantity * h.averageCostKRW, 0) / totalQuantity;  // 100,050원
```

---

## 데이터 입력 방식

### 월별(또는 임의 시점) 스냅샷 입력 — 주 입력 경로

종목별로 "현재 상태"(수량·평균단가·현재가)를 스냅샷으로 입력합니다. 저장 시
`HoldingValueSnapshot`이 upsert되고, **최신 스냅샷의 수량·평균단가가 `Holding`에 동기화**됩니다.
(`saveMonthlyInput` → `holdingValueSnapshotRepository.findLatestByHoldingId` → `Holding.update`)

### 매수/매도 기록 — 비권위 보조

거래(`HoldingTransaction`)는 참고용 보조 기록입니다. **거래를 생성/삭제해도 `Holding`을
자동 재계산하지 않습니다.** 스냅샷이 SSOT이므로 보유량·평균단가는 스냅샷 입력으로만 갱신됩니다.

### 계좌 잔액 (월말 기준)

계좌의 현금 잔액은 월말 기준으로 직접 입력합니다:

- `Account.cashBalance`: 현재(최신) 잔액
- `AccountSnapshot`: 월말 스냅샷 이력

---

## 스냅샷 생성 플로우

월말에 다음 순서로 데이터를 입력합니다:

```
1. 각 계좌의 월말 현금 잔액 입력
   → Account.cashBalance 업데이트

2. 각 보유 종목의 월말 평가액 입력
   → HoldingValueSnapshot 생성

3. AccountSnapshot 생성
   → 현재 cashBalance + holdingsValue 합산
```

### 주의사항

`AccountSnapshot.holdingsValue`는 스냅샷 생성 시점의 현재 Holding 평가액을 기준으로 계산됩니다. 따라서 **HoldingValueSnapshot을 먼저 입력한 후 AccountSnapshot을 생성**해야 정확한 값이 저장됩니다.

---

## 모델별 역할 정리

| 모델 | 역할 | 갱신 시점 |
|------|------|----------|
| `Account.cashBalance` | 현재 현금 잔액 | 월말 직접 입력 |
| `Holding` | 현재 보유량/평균단가 (캐시) | 스냅샷 저장 시 최신 스냅샷으로 동기화 |
| `HoldingValueSnapshot` | 시점별 보유 종목 스냅샷 (SSOT). `quantity·priceKRW·avgCostKRW·totalValueKRW` | 스냅샷 입력 시 |
| `HoldingTransaction` | 매수/매도 기록 (비권위 보조) | 거래 입력 시 생성, `Holding` 미갱신 |
| `AccountSnapshot` | (미사용/죽은 코드) | — |
| `AssetPrice` | (미사용/죽은 코드) | — |
