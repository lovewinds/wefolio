# Services Layer

비즈니스 로직을 담당하는 서비스 레이어. Repository를 통해 데이터에 접근한다.

## 파일 구조

| 파일                     | 설명                                           |
| ------------------------ | ---------------------------------------------- |
| `transaction-service.ts` | 수입/지출 거래 CRUD 및 조회                    |
| `category-service.ts`    | 카테고리 CRUD (대분류/소분류 지원)             |
| `statistics-service.ts`  | 월별/카테고리별 통계 집계                      |
| `account-service.ts`     | 계좌/금융기관/가족구성원 관리                  |
| `holding-service.ts`     | 보유종목/가격/거래/포트폴리오 관리             |

## 자산 관리 시스템 (신규)

### account-service.ts

계좌 및 관련 엔티티의 비즈니스 로직을 담당한다.

| Service               | 역할                                                          |
| --------------------- | ------------------------------------------------------------- |
| `institutionService`  | 금융기관(은행/증권사) CRUD 및 기관별 자산 요약 집계           |
| `familyMemberService` | 가족 구성원 CRUD 및 구성원별 자산 요약 (현금, 보유종목, 총액) |
| `accountService`      | 계좌 CRUD, 현금잔고 관리, 월별 스냅샷 생성/조회, 계좌별 요약  |

### holding-service.ts

보유종목 및 거래의 비즈니스 로직을 담당한다.

| Service                       | 역할                                                          |
| ----------------------------- | ------------------------------------------------------------- |
| `assetMasterService`          | 자산 마스터(종목 정의) CRUD, 분류/통화별 조회                 |
| `assetPriceService`           | 자산 가격 이력 관리, 최신가/기간별 조회, upsert 지원          |
| `holdingService`              | 보유종목 CRUD, 현재가 기준 평가액/손익 계산, 자산분류별 집계  |
| `holdingTransactionService`   | 매수/매도 거래 기록, 거래 후 보유량/평균단가 자동 재계산      |
| `holdingValueSnapshotService` | 보유종목 스냅샷 관리 (기존 데이터 import, 주기적 추적용)      |
| `portfolioService`            | 전체 포트폴리오 통합 조회 (구성원별, 자산분류별, 기관별 요약) |

## 타입 정의

주요 타입은 `@/types/asset.ts`에 정의되어 있다.

- `AssetInstitutionType`: `'bank' | 'brokerage'`
- `AccountType`: `'savings' | 'time_deposit' | 'cma' | 'regular' | 'pension_savings' | 'irp' | 'isa'`
- `AssetClass`: `'stock' | 'bond' | 'deposit' | 'gold' | 'fund' | 'etf'`
- `Currency`: `'KRW' | 'USD'`
- `HoldingTransactionType`: `'buy' | 'sell' | 'dividend' | 'transfer_in' | 'transfer_out'`
