# 설정 · 데이터 관리 화면

설정 영역의 화면 구성 기준(SSOT). 기존 디자인 프로토타입(`design/`)에는 설정 그룹의 `기준 데이터`(FR-A, 구성원·기관·계좌·종목 CRUD)만 있고, **데이터 로드/삭제 화면은 디자인에 없던 신규 화면**이라 이 문서로 기준을 둔다.

## 내비게이션 (LNB)

디자인 LNB의 그룹형 구조(`design/WeFolio Dashboard.html`의 `인사이트 / 기록 / 설정`)를 따른다. `설정`은 LNB의 그룹이며, 그룹 항목이 직접 페이지로 연결된다(별도 설정 랜딩 페이지 없음). '우리 집' 푸터 카드는 버튼 없는 표시 전용으로 그대로 둔다.

- `설정` 그룹 (`메뉴` 그룹과 `sb-foot` 사이)
  - `데이터` → `/settings/data` (database 아이콘) — 데이터 로드/삭제
  - (예정) `기준 데이터` → 구성원·기관·계좌·종목 CRUD (M009, `design/views-manage.jsx` `BaseDataView`). `데이터`와 형제 항목으로 같은 `설정` 그룹에 추가한다.

## 데이터 관리 (`/settings/data`)

커맨드라인 `pnpm db:seed`가 화면에서 로드 결과를 보여주지 못하는 한계를 대체한다. 한 페이지에 **로드**와 **삭제** 두 섹션을 카드로 둔다.

### 데이터 로드 (카드)

- xlsx 파일 업로드 방식. 점선 드롭존(클릭 선택 + 드래그 앤 드롭, `accept=".xlsx"`), 선택 파일명 표시.
- `로드` 기본 버튼(파일 선택 전 비활성). 로드 결과(삽입 건수 등)는 버튼 아래 결과 영역에 표시.

### 데이터 삭제 (카드)

- 도메인별 선택 삭제. 도메인 분리는 `prisma/CLAUDE.md` 기준(가계부 / 자산은 독립 도메인).
  - `가계부`: 수입·지출 거래·카테고리 (`BudgetTransaction`·`BudgetCategory`·`BudgetRecurringTemplate`)
  - `자산`: 계좌·보유 종목·스냅샷 (`Account`·`Holding`·`HoldingSnapshot`·`CashSnapshot`·`HoldingTransaction`·`AssetMaster`·`Institution`·`Member`)
- 각 도메인 카드: 도메인명·설명·현재 건수·`삭제` 버튼. 삭제는 확인 후 실행.

## 구현 단계

- Phase 1 (레이아웃·내비게이션): `설정` 그룹 + `데이터` 항목, `/settings/data` 로드/삭제 레이아웃. 파일 선택·상태 표시는 동작하되 실제 로드/삭제·건수는 placeholder.
- Phase 2 (백엔드): 업로드 xlsx 파싱→삽입 API, 도메인별 일괄 삭제·건수 조회 API, 실제 결과·확인 다이얼로그. 시드 파서(`prisma/seed/*`) 재사용 검토.
