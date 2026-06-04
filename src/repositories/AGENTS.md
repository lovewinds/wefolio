# Repositories Layer

데이터 접근을 추상화하는 레이어. DB 교체 시 이 레이어만 수정하면 된다.

## 파일 구조

| 파일                               | 설명                                 |
| ---------------------------------- | ------------------------------------ |
| `transaction-repository.ts`        | 수입/지출 거래 데이터 접근           |
| `category-repository.ts`           | 카테고리 데이터 접근                 |
| `recurring-template-repository.ts` | 고정 지출 템플릿 데이터 접근         |
| `account-repository.ts`            | 계좌/금융기관/가족구성원 데이터 접근 |
| `holding-repository.ts`            | 보유종목/가격/거래 데이터 접근       |

## 자산 관리 시스템 (신규)

### account-repository.ts

계좌 및 관련 엔티티의 데이터 접근을 담당한다.

| Repository                  | 역할                                                                              |
| --------------------------- | --------------------------------------------------------------------------------- |
| `institutionRepository`     | 금융기관(은행/증권사) CRUD, 타입별 조회, 소프트 삭제                              |
| `familyMemberRepository`    | 가족 구성원(`Member`) CRUD, 이름 조회, 소프트 삭제                                |
| `accountRepository`         | 계좌 CRUD, 구성원/기관/타입별 조회 (member, institution 관계 포함)                |

### holding-repository.ts

보유종목 및 거래의 데이터 접근을 담당한다.

| Repository                       | 역할                                                                                           |
| -------------------------------- | ---------------------------------------------------------------------------------------------- |
| `assetMasterRepository`          | 자산 마스터(종목 정의) CRUD, 이름+통화/분류/통화별 조회, 소프트 삭제                          |
| `holdingRepository`              | 보유종목 CRUD, 계좌/종목별 조회 (현재상태 캐시 없음 — 연결만, assetMaster 관계 포함)          |
| `holdingTransactionRepository`   | 매수/매도 거래 CRUD(비권위 보조), 날짜 범위/거래유형별 조회                                    |
| `holdingValueSnapshotRepository` | 보유종목 스냅샷(`HoldingSnapshot`) 관리(SSOT, `snapshotDate`·`avgCostKRW`·`currentPriceKRW`·원통화 보존), 날짜 범위 조회, 최신 스냅샷, upsert 지원 |

## 설계 원칙

1. **소프트 삭제**: 대부분의 엔티티는 `isActive` 플래그로 소프트 삭제
2. **관계 포함**: 조회 시 필요한 관계를 include로 함께 조회
3. **Upsert 지원**: 스냅샷은 `snapshotDate` 기준 upsert 지원
4. **복합 유니크**: 계좌+종목, 종목+일자, 계좌+일자 등 복합키 지원

## 관련 Prisma 모델

```
Institution, Member, Account
AssetMaster, Holding, HoldingTransaction, HoldingSnapshot, CashSnapshot
```

## References

- [Database Schema](docs/schema-guide.md)
