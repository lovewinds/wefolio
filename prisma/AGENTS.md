# 스키마 설계 가이드

WeFolio 데이터 모델의 설계 원칙과 사용 지침을 정리한 문서입니다.

> **2026-06-04 모델 방향 (V2)**: 자산 도메인은 **스냅샷을 단일 진실원천(SSOT)** 으로 삼는다.
> `HoldingSnapshot`이 보유 종목의 현재 상태를 결정한다(키는 일자 기준 `snapshotDate` — 월말 기본, 주 단위 등 임의 시점 허용).
> `Holding`은 현재상태 캐시 컬럼을 두지 않으며 **현재상태 = 최신 `HoldingSnapshot`** 으로 파생한다.
> 계좌 현금은 `CashSnapshot`(일자별 `cashBalanceKRW`)으로 관리한다(`Account.cashBalance` 컬럼은 제거됨).
> `HoldingTransaction`/거래 화면은 **비권위 보조**로만 유지하고 `Holding`을 자동으로 갱신하지 않는다.
> `AssetPrice`/`AccountSnapshot` 모델은 **제거됨**(2026-06-04, M006 incr 3c).
> 설계 기준(SSOT)은 `docs-new/data-model.md`·`docs-new/asset-management.md`이며, 배경은 `docs/work-items/asset-recurring-input-analysis.md` 참조.

---

## 도메인 분리 원칙

### 가계부와 자산 관리는 연결하지 않음

두 도메인은 독립적으로 운영됩니다:

| 도메인 | 모델 | 용도 |
|--------|------|------|
| 가계부 | `BudgetTransaction`, `BudgetCategory` | 수입/지출 기록 |
| 자산 관리 | `Account`, `Holding`, `HoldingSnapshot`, `CashSnapshot` | 자산 현황 추적 |

연결하지 않는 이유:
- 가계부는 단순 기록 용도
- 자산 관리는 포트폴리오 분석 용도
- 두 도메인 간 통합 분석 불필요

---

## 자산-계좌 관계 구조

### 동일 종목의 다중 계좌 보유

같은 종목을 여러 계좌에서 보유할 수 있습니다. `Holding`은 연결만 들고, 수량·평균단가 등 현재 상태는
최신 `HoldingSnapshot`에서 파생합니다:

```
AssetMaster (삼성전자)
│
├── Holding (삼성증권 계좌)
│   ├── HoldingTransaction (매수/매도 기록, 비권위)
│   └── HoldingSnapshot (시점별 스냅샷, SSOT) ← 최신 스냅샷이 현재 상태
│
└── Holding (메리츠증권 계좌)
    ├── HoldingTransaction (매수/매도 기록, 비권위)
    └── HoldingSnapshot (시점별 스냅샷, SSOT)
```

### 핵심 제약조건

```prisma
// 계좌별 종목은 하나의 Holding만 존재
@@unique([accountId, assetMasterId])

// 종목별 일자는 하나의 스냅샷만 존재
@@unique([holdingId, snapshotDate])

// 계좌별 일자는 하나의 현금 스냅샷만 존재
@@unique([accountId, snapshotDate])
```

### 사용자 레벨 집계

개별 Holding은 계좌별로 분리 관리되며, 사용자 레벨 집계(총 보유량, 평균단가)는 서비스 계층에서
각 Holding의 최신 스냅샷을 합산해 계산합니다.

---

## 데이터 입력 방식

### 월별(또는 임의 시점) 스냅샷 입력 — 주 입력 경로

종목별로 "현재 상태"(수량·평균단가·현재가)를 스냅샷으로 입력합니다. 저장 시 `HoldingSnapshot`이
upsert되며, 현재 상태는 항상 **최신 스냅샷**으로 조회 시 파생합니다(별도 동기화 없음).

외화 종목은 원화 환산값(`avgCostKRW`/`currentPriceKRW`)과 함께 원통화 입력값(`priceOriginal`/
`avgCostOriginal`)·`exchangeRate`를 보존 저장합니다.

### 매수/매도 기록 — 비권위 보조

거래(`HoldingTransaction`)는 참고용 보조 기록입니다. **거래를 생성/삭제해도 `Holding`이나 스냅샷을
자동 재계산하지 않습니다.** 스냅샷이 SSOT이므로 보유량·평균단가는 스냅샷 입력으로만 갱신됩니다.

### 계좌 현금 잔액

계좌의 현금 잔액은 일자별 `CashSnapshot.cashBalanceKRW`로 관리합니다(SSOT). 종목 스냅샷과 동일한
스냅샷 모델입니다.

---

## 파생값 (저장하지 않음)

원금·평가액·수익·수익률은 스냅샷 입력값에서 조회 시 계산하며 DB에 저장하지 않습니다.

| 값 | 산출식 |
|----|--------|
| 원금 | `quantity × avgCostKRW` |
| 평가액 | `quantity × currentPriceKRW` |
| 수익 | `평가액 − 원금` |

---

## 모델별 역할 정리

| 모델 | 역할 | 갱신 시점 |
|------|------|----------|
| `Holding` | 계좌×종목 연결 단위 (현재상태 캐시 없음) | 종목 신규 보유 시 생성 |
| `HoldingSnapshot` | 시점별 보유 종목 스냅샷 (SSOT). `quantity·avgCostKRW·currentPriceKRW·exchangeRate·priceOriginal·avgCostOriginal` | 스냅샷 입력 시 upsert |
| `CashSnapshot` | 시점별 계좌 현금 스냅샷 (SSOT). `cashBalanceKRW` | 현금 입력 시 upsert |
| `HoldingTransaction` | 매수/매도 기록 (비권위 보조) | 거래 입력 시 생성, `Holding`·스냅샷 미갱신 |
