# 스키마 설계 가이드

WeFolio 데이터 모델의 설계 원칙과 사용 지침을 정리한 문서입니다.

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

### 매수/매도 기록

계좌별로 수량과 가격을 각각 입력합니다:

```
입력 예시:
- 삼성증권 → 삼성전자 5주 @ 100,000원
- 메리츠증권 → 삼성전자 5주 @ 100,100원
```

`HoldingTransaction` 생성 후 해당 `Holding`의 `quantity`와 `averageCostKRW`가 자동 재계산됩니다.

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
| `AccountSnapshot` | 월별 계좌 스냅샷 | 월말 생성 |
| `Holding` | 현재 보유량/평균단가 | 거래 시 자동 계산 |
| `HoldingTransaction` | 매수/매도 기록 | 거래 시 생성 |
| `HoldingValueSnapshot` | 월별 보유 종목 스냅샷 | 월말 생성 |
| `AssetPrice` | 종목 가격 이력 | API 또는 수동 입력 |
