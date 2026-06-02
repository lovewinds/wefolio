# 데이터 모델

자산 도메인을 **간결하게 재설계**한 데이터 모델이다. 핵심 변화는 거래 기록·가격 이력 테이블을
없애고, **월별 스냅샷 2종(현금/종목)** 으로 단순화한 것이다.

## 1. 도메인 분리

가계부와 자산 관리는 **독립**적으로 운영한다 (통합 분석 없음). 기존 원칙을 유지한다.

---

## 2. 상수 정의 (enum성 상수)

자산군·세부분류·위험구분·계좌유형·통화는 **앱 레벨 문자열 상수**로 고정한다.
SQLite에서는 `String` 컬럼으로 저장하고, PostgreSQL 이관 시 Prisma `enum`으로 승격할 수 있다.
값은 기존 시드 파서(`prisma/seed/read-xlsx-asset.ts`)의 정규화 결과와 일치시킨다.

```ts
// src/constants/asset.ts (예정)

export const ASSET_CLASS = ['주식', '채권', '예금', '금', '코인'] as const;
export type AssetClass = (typeof ASSET_CLASS)[number];

export const SUB_CLASS = ['성장', '배당', '국채', '회사채'] as const;
export type SubClass = (typeof SUB_CLASS)[number];

export const RISK_LEVEL = ['위험자산', '안전자산'] as const;
export type RiskLevel = (typeof RISK_LEVEL)[number];

export const ACCOUNT_TYPE = [
  '예금', '적금', '청약', '종합', 'CMA', 'IRP', 'ISA', '연금저축', '코인', '금현물',
] as const;
export type AccountType = (typeof ACCOUNT_TYPE)[number];

export const CURRENCY = ['KRW', 'USD'] as const;
export type Currency = (typeof CURRENCY)[number];
```

> **현금형 종목 판정**: 종목명에 `예금/청약/포인트/현금/캐시/자동운용/RP/MMF`가 포함되면
> 수량·가격 없이 평가액 한 값만 입력하는 _value형_ 으로 취급한다. (입력 UX는 asset-management.md 참조)

---

## 3. 자산 모델

### 기준 데이터

```prisma
model Member {
  id        String   @id @default(cuid())
  name      String   @unique          // "지완", "지아"
  color     String?                   // UI 표시용
  isActive  Boolean  @default(true)
  accounts  Account[]
}

model Institution {
  id        String   @id @default(cuid())
  name      String   @unique          // "농협은행", "나무증권"
  type      String                    // "bank" | "brokerage"
  isActive  Boolean  @default(true)
  accounts  Account[]
}

model Account {
  id             String   @id @default(cuid())
  memberId       String
  institutionId  String
  name           String                // "급여통장", "IRP", "ISA"
  accountType    String                // ACCOUNT_TYPE 상수
  currency       String   @default("KRW")
  isActive       Boolean  @default(true)

  member         Member       @relation(fields: [memberId], references: [id])
  institution    Institution  @relation(fields: [institutionId], references: [id])
  holdings       Holding[]
  cashSnapshots  CashSnapshot[]

  @@index([memberId])
  @@index([institutionId])
}

model AssetMaster {
  id         String   @id @default(cuid())
  name       String                    // "삼성전자", "S&P 500 ETF"
  symbol     String?                   // 티커 (선택)
  assetClass String                    // ASSET_CLASS 상수
  subClass   String?                   // SUB_CLASS 상수
  riskLevel  String                    // RISK_LEVEL 상수
  currency   String   @default("KRW")  // CURRENCY 상수
  isActive   Boolean  @default(true)

  holdings   Holding[]

  @@unique([name, currency])
}
```

### 보유 + 월별 스냅샷 (핵심)

```prisma
// 계좌 × 종목 = 보유 단위. 현재 상태를 들고 있다.
model Holding {
  id             String   @id @default(cuid())
  accountId      String
  assetMasterId  String

  account        Account      @relation(fields: [accountId], references: [id])
  assetMaster    AssetMaster  @relation(fields: [assetMasterId], references: [id])
  snapshots      HoldingSnapshot[]

  @@unique([accountId, assetMasterId])   // 계좌당 종목 1개 (동일 종목 다중 계좌 보유 허용)
}

// 종목 월별 스냅샷 — 투자 자산의 단일 진실원천(SSOT)
model HoldingSnapshot {
  id              String   @id @default(cuid())
  holdingId       String
  yearMonth       String                  // "2024-12" (월 단위 키)
  quantity        Float                   // 수량
  avgCostKRW      Float                   // 평균단가(원화) → 원금 = quantity × avgCostKRW
  currentPriceKRW Float                   // 현재가(원화) → 평가액 = quantity × currentPriceKRW
  exchangeRate    Float?                  // 외화 종목의 적용 환율 (원화 종목은 null)

  holding         Holding  @relation(fields: [holdingId], references: [id])

  @@unique([holdingId, yearMonth])
  @@index([yearMonth])
}

// 계좌 현금 월별 스냅샷 — 현금 자산의 단일 진실원천(SSOT)
model CashSnapshot {
  id            String   @id @default(cuid())
  accountId     String
  yearMonth     String                    // "2024-12"
  cashBalanceKRW Float                     // 해당 월말 현금 잔고(원화)

  account       Account  @relation(fields: [accountId], references: [id])

  @@unique([accountId, yearMonth])
  @@index([yearMonth])
}
```

### 폐기된 모델

| 폐기 | 대체 |
|------|------|
| `HoldingTransaction` | 없음 — 거래 기록 미사용, 상태 직접 수정 ([ADR](./asset-management.md#adr-거래-기록-테이블을-두지-않는다)) |
| `AssetPrice` | `HoldingSnapshot.currentPriceKRW` 에 통합 (가격 이력 = 스냅샷 이력) |
| `AccountSnapshot` | `CashSnapshot` + 종목 스냅샷 집계로 대체 (현금/평가액을 별도 저장하지 않음) |
| `HoldingValueSnapshot` | `HoldingSnapshot` 으로 통합 (원금·평가액 동시 보유) |
| `Holding.quantity/averageCostKRW` (현재상태 컬럼) | 최신 `HoldingSnapshot` 으로 대체 |

> 설계 단순화 포인트: 기존엔 "현재 상태(Holding)"와 "월별 이력(Snapshot)"이 분리되어 어긋났다.
> 새 모델에서 **현재 상태 = 최신 월 스냅샷**이므로 격차가 발생할 수 없다.
> `yearMonth` 문자열 키를 써서 "월 단위" 의미를 모델에 명시한다(기존 `date` 기준일 모호성 제거).

---

## 4. 가계부 모델 (기존 유지)

`prisma/schema.prisma` L10–L53의 기존 모델을 그대로 사용한다.

```prisma
model BudgetCategory {
  id, name, type("income"|"expense"), icon?, color?, isDefault,
  parentId?, parent/children(CategoryHierarchy), createdAt, updatedAt
}
model BudgetTransaction {
  id, type, amount, description?, date, categoryId, paymentMethod?, user?, createdAt, updatedAt
}
model BudgetRecurringTemplate {
  id, name, type, amount, description?, categoryId, createdAt, updatedAt
}
```

---

## 5. 기존 엑셀 시드 → 새 모델 매핑

### 자산 시트 (`prisma/seed/read-xlsx-asset.ts`, 7번 시트, 컬럼 A–O)

| 엑셀 열 | 라벨 | 새 모델 필드 |
|---------|------|--------------|
| C | 사용자 | `Member.name` |
| G | 기관 | `Institution.name` (증권 키워드 → `type=brokerage`, 그 외 `bank`) |
| B | 투자/연금 | `Account.accountType` (계좌명 힌트로 정규화: IRP/ISA/CMA/연금저축 등) |
| H | 계좌명 | `Account.name` |
| I | 종목명 | `AssetMaster.name` |
| E | 대분류 | `AssetMaster.assetClass` (ASSET_CLASS로 정규화) |
| F | 분류 | `AssetMaster.subClass` (SUB_CLASS로 정규화, 없으면 null) |
| D | 위험/안전 | `AssetMaster.riskLevel` (RISK_LEVEL로 정규화) |
| N | 환율 | `HoldingSnapshot.exchangeRate` (환율>1 → `currency=USD`, 그 외 KRW·null) |
| J | 기준일자 | → `HoldingSnapshot.yearMonth` ("YYYY-MM"으로 변환) |
| K | 보유개수 | `HoldingSnapshot.quantity` |
| L | 개당가격 | `HoldingSnapshot.avgCostKRW` **및** `currentPriceKRW` 초기값 |
| O | 원화금액 | 검증용(= quantity × currentPriceKRW). 현금형은 평가액으로 사용 |

> **현금형 종목**(K·L 누락): `quantity=1`, `avgCostKRW = currentPriceKRW = O(원화금액)` 으로 적재.
> 기존 파서의 `isCashLikeAsset` 규칙과 동일.

> **평균단가 주의**: 기존 엑셀에는 _평균단가_ 컬럼이 없고 _개당 현재가(L)_ 만 있다.
> 시드 적재 시 `avgCostKRW`를 `currentPriceKRW`와 동일하게 넣어 **수익 0**으로 시작하고,
> 이후 사용자가 평균단가를 보정한다. (원금 데이터는 사용자가 채워가는 값)

### 가계부 시트 (`read-xlsx-expense.ts` / `read-xlsx-income.ts`)

| 엑셀 열 | 새 모델 필드 |
|---------|--------------|
| A 대분류 / 감지 | `BudgetTransaction.type` ("income"/"expense") |
| B 분류 | `BudgetCategory`(소분류) → `categoryId` |
| C 일자 | `date` |
| D 내역 | `description` |
| E 금액 | `amount` |
| F 지출방법 | `paymentMethod` |
| G 사용자 | `user` |

카테고리 계층은 기존 시트(소분류↔대분류 매핑)를 그대로 `BudgetCategory.parentId`로 적재.
