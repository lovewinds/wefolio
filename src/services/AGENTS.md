# Services Layer

비즈니스 로직을 담당하는 서비스 레이어. Repository를 통해 데이터에 접근한다.

## 파일 구조

| 파일                     | 설명                               |
| ------------------------ | ---------------------------------- |
| `transaction-service.ts` | 수입/지출 거래 CRUD 및 조회        |
| `category-service.ts`    | 카테고리 CRUD (대분류/소분류 지원) |
| `statistics-service.ts`  | 월별/카테고리별 통계 집계          |
| `account-service.ts`     | 계좌/금융기관/가족구성원 관리      |
| `holding-service.ts`     | 보유종목/가격/거래/포트폴리오 관리 |

## 자산 관리 시스템 (신규)

### account-service.ts

계좌 및 관련 엔티티의 비즈니스 로직을 담당한다.

| Service               | 역할                                                          |
| --------------------- | ------------------------------------------------------------- |
| `institutionService`  | 금융기관(은행/증권사) CRUD 및 기관별 자산 요약 집계           |
| `familyMemberService` | 가족 구성원(`Member`) CRUD                                    |
| `accountService`      | 계좌 CRUD, 구성원/기관/타입별 조회                            |

### holding-service.ts

보유종목 및 거래의 비즈니스 로직을 담당한다.

| Service                       | 역할                                                          |
| ----------------------------- | ------------------------------------------------------------- |
| `assetMasterService`          | 자산 마스터(종목 정의) CRUD, 분류/통화별 조회                 |
| `holdingService`              | 보유종목 CRUD, 드롭다운용 목록(`getAllWithAccountInfo`)       |
| `holdingTransactionService`   | 매수/매도 거래 기록(비권위 보조 — Holding 미갱신)            |
| `holdingValueSnapshotService` | 월별/시점별 스냅샷(`HoldingSnapshot`) 관리(SSOT), 입력 초안·저장, 월별/추이 집계. 평가액·원금은 입력값에서 파생 |

## 타입 정의

enum성 상수는 `@/constants/asset.ts`(SSOT)에서 파생하며 `@/types/asset.ts`가 재노출한다.

- `AccountType`: `'예금' | '적금' | '청약' | '종합' | 'CMA' | 'IRP' | 'ISA' | '연금저축' | '코인' | '금현물'`
- `AssetClass`: `'주식' | '채권' | '예금' | '금' | '코인'`
- `RiskLevel`: `'위험자산' | '안전자산'`
- `Currency`: `'KRW' | 'USD'`
- `HoldingTransactionType`: `'buy' | 'sell' | 'dividend' | 'transfer_in' | 'transfer_out'` (비권위 보조)
