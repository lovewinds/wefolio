# M006. 자산 데이터 관리 안정화

## 설명

자산 관리를 거래 입력 중심에서 월말 스냅샷 입력 중심으로 안정화합니다. MVP에서는 정확한 모든 매수/매도 이력보다 월말 포트폴리오 현황을 빠르게 마감하는 흐름을 우선합니다.

## Goals

- [ ] 자산 기준 데이터 수정/삭제 정책과 UI가 정리되어 있다
- [ ] 자산 거래를 수정할 수 있다 (비권위 보조 화면으로 유지 — 우선순위 하향)
- [x] 월별 스냅샷 생성/수정 UX 또는 자동 생성 정책이 결정되어 있다
- [x] 가격 이력과 환율 입력/외부 연동 방향이 결정되어 있다 (환율 **수동 입력** 확정, 외부 API 미사용 — [분석 문서](../work-items/asset-recurring-input-analysis.md))
- [ ] 스냅샷을 SSOT로 고정하고 거래를 비권위로 격리한다 (거래 입력이 `Holding`/스냅샷 값을 자동으로 덮어쓰지 않음)

> 2026-06-04 결정 반영: 모델은 **스냅샷 전용 + 일자(`snapshotDate`) 키**로 통일하고, 거래 기록/화면은 **삭제하지 않고 비권위 보조로 유지**한다. 디자인 SSOT는 `docs-new/data-model.md`·`asset-management.md`(ADR 개정본). 배경·결정은 [자산 반복 입력 진단 문서](../work-items/asset-recurring-input-analysis.md) 참조.

## Goal 상세

### 월별 스냅샷 생성/수정 UX

`/asset/monthly`에서 `이번 달 자산 입력` 패널을 열어 전월 스냅샷을 복사한 초안을 편집하고 `HoldingValueSnapshot`에 업로드할 수 있습니다.

- `GET /api/asset/monthly-input?year=&month=`가 전월/당월 스냅샷을 병합한 입력 초안을 반환합니다.
- `POST /api/asset/monthly-input`이 여러 보유 자산 스냅샷을 `source: manual`로 upsert합니다.
- 입력 패널은 소유자별 또는 자산유형별로 그룹을 전환해 확인할 수 있습니다.
- 서버 업로드 전 입력 결과는 월 단위 localStorage 임시저장본으로 보관하고 다시 불러올 수 있습니다.
- 예금/CMA/현금성 자산은 평가금액 중심으로 입력합니다.
- 수량형 자산은 수량, 현재가, 환율, 원화 현재가를 입력하고 평가금액을 자동 계산하되 수정할 수 있습니다.
- 당월 일부 스냅샷이 이미 있으면 기존 입력 수정 모드로 열고, 전월에는 있었지만 당월 입력이 빠진 행은 저장 전에 막습니다.

### 스냅샷 SSOT + 거래 비권위 격리 (진행 중)

- [x] increment 1: 거래(`record`/`delete`)가 `Holding.quantity/averageCostKRW`를 자동 갱신하지 않도록 격리. `saveMonthlyInput`이 최신 스냅샷 수량을 `Holding.quantity`에 동기화.
- [x] increment 2: **불필요로 판명**. 라이브 자산 화면(`/asset/portfolio`·`/asset/monthly`·`/asset/trend`)은 이미 `getMonthlyAssetData` 계열로 스냅샷 기반이다. `AssetPrice` 기반 현재값 함수(`getWithCurrentValue`·`getSummaryByAssetClass`·`portfolioService.getSummary`·`getTotalValueByAccountId`·`getSummary` 계열)와 `AssetPrice`/`AccountSnapshot` 모델은 모두 프로덕션 호출처가 없는 죽은 코드다. → incr 3 스키마 작업에서 함께 정리.
- [ ] increment 3: 평균단가(cost basis) 입력 경로.
  - [x] 3a 데이터/서비스: `HoldingValueSnapshot.avgCostKRW` 컬럼 추가, `saveMonthlyInput`이 평균단가를 스냅샷에 저장하고 최신 스냅샷의 `avgCostKRW`로 `Holding.averageCostKRW` 동기화(미입력 시 현재가로 시작). 타입/검증/리포지토리/시드 반영, dev.db `db push`(비파괴, default 0). TDD.
  - [ ] 3b UI 폼: 월별 입력 패널(수량형)에 평균단가 입력 필드 노출 — `docs-new` 디자인 확인 후 진행. 현재 신규 행 `avgCostKRW`는 0으로 두고 저장 시 현재가로 대체됨.
  - [ ] 3c 정리: 죽은 `AssetPrice`/`AccountSnapshot` 모델과 AssetPrice 기반 함수 제거(스키마 변경, 별도 진행).
- 참고: `recordBuy`/`recordSell`/`updateHoldingAfterTransaction`는 호출처 없는 레거시(거래→Holding 재계산 커플링)다. 거래 화면 재도입 방향 확정 시 정리한다.

### 남은 범위

자산 기준 데이터의 수정/삭제 UI, 자산 거래 수정은 후속 작업입니다. 외부 시세/환율 연동은 **수동 입력으로 확정**되어 닫혔습니다.

## Tasks

| 일시       | Task                            | 결과                                                                 |
| ---------- | ------------------------------- | -------------------------------------------------------------------- |
| 2026-05-09 | 월별 자산 입력 API 추가         | 월별 입력 초안 조회와 일괄 스냅샷 저장 API 구현                      |
| 2026-05-09 | `/asset/monthly` 입력 패널 추가 | 전월 복사, 상태 표시, 수량형/평가금액형 입력, 자산 추가 흐름 구현    |
| 2026-05-09 | 검증 및 문서 갱신               | API route 테스트, 체크리스트, 프로젝트 상태 문서 갱신                |
| 2026-05-09 | 입력 패널 검토 흐름 보완        | 소유자별/자산유형별 그룹 확인과 localStorage 임시저장/불러오기 추가 |
| 2026-06-04 | 거래 비권위 격리 (increment 1)  | `record()`/`delete()`에서 Holding 재계산 제거, `saveMonthlyInput`이 최신 스냅샷 수량으로 `Holding.quantity` 동기화. TDD(3 테스트 추가) |

## 트러블슈팅

| 일시       | 문제                        | 원인                      | 처리                                                    |
| ---------- | --------------------------- | ------------------------- | ------------------------------------------------------- |
| 2026-05-09 | 당월 일부 스냅샷 누락 가능성 | 기존 입력 수정 중 부분 저장 | 누락 행은 빈 입력으로 표시하고 저장 전 경고/차단 처리 |

## ADR

- 없음
