# M003. 월간 가계부 흐름 통합

## 설명

현재 월간 가계부는 `/budget/monthly` 요약, `/budget/monthly/detail` 상세 목록, `/budget/monthly/input` 추천 기반 입력이 별도 페이지로 나뉘어 있습니다. 화면은 각각 명확하지만, 거래를 확인하고 입력하는 과정에서 페이지 이동이 반복되어 월 컨텍스트와 작업 흐름이 끊깁니다.

이 마일스톤은 `/budget/monthly`를 월간 가계부의 단일 허브로 두고, 요약과 거래 목록은 같은 월 컨텍스트 안에서 전환하며, 추천 기반 거래 입력은 페이지 이동 없이 패널/시트로 열 수 있게 정리합니다. 단, 카테고리 CRUD, 반복 템플릿 CRUD, 연간 통계 확장은 이 마일스톤 범위에 포함하지 않습니다.

## 결정한 방향

- `/budget/monthly`를 월간 가계부의 canonical route로 유지합니다.
- 요약과 상세 목록은 `?view=summary` / `?view=detail` 상태로 전환합니다.
- 추천 기반 입력은 데스크톱 우측 패널, 모바일 하단 시트 형태로 엽니다.
- 기존 상세 표 하단의 인라인 입력은 빠른/대량 입력 흐름으로 유지합니다.
- 기존 `/budget/monthly/detail`, `/budget/monthly/input` 라우트는 호환성을 위해 새 URL로 redirect하거나 얇은 compatibility route로 정리합니다.

## Goals

- [x] 월별/기간별 거래 목록을 `GET /api/transactions`로 직접 조회할 수 있다
- [x] 월별 상세 목록과 추천 로직이 `fetchDashboardData` mock 경유 없이 실제 API 클라이언트를 사용한다
- [x] `/budget/monthly`에서 요약과 거래 목록을 같은 월 컨텍스트 안에서 전환할 수 있다
- [x] 추천 기반 거래 입력을 별도 페이지 이동 없이 패널/시트에서 사용할 수 있다
- [x] 거래 생성/수정/삭제 후 요약, 목록, 입력 패널의 데이터 갱신 흐름이 검증되어 있다
- [x] 기존 `/budget/monthly/detail`, `/budget/monthly/input` 진입 정책이 결정되어 끊긴 링크가 없다
- [ ] 모바일/데스크톱/다크 모드에서 탭, 패널, 표, CTA가 겹치지 않는다

## Goal 상세

### 거래 목록 API 정리

`GET /api/transactions`를 추가해 월별 거래 목록을 직접 조회합니다. 1차 UI는 `year` + `month` 기준을 사용하고, 기간 조회가 필요하면 `startDate` + `endDate`를 선택 파라미터로 지원합니다. 반환 데이터는 기존 `MonthlyDetailTable`과 추천 로직이 사용할 수 있는 거래 목록 형태로 맞춥니다.

### mock 경유 제거

`/budget/monthly/detail`과 `useRecommendations`의 최근 거래 조회에서 `fetchDashboardData` 의존을 제거합니다. 상세 목록은 거래 API를 직접 사용하고, 추천 로직은 최근 3개월 거래를 거래 API로 조회한 뒤 템플릿 API 결과와 합칩니다.

### 월간 허브 UI

`/budget/monthly` 안에 월 선택, 주요 CTA, `요약`/`거래 목록` 탭을 둡니다. 요약 탭은 KPI, 수입/지출 비교, 카테고리 분석, 최근 거래 일부만 보여 과밀해지지 않게 유지합니다. 거래 목록 탭은 기존 상세 테이블을 재사용하되 별도 월 선택 헤더는 중복하지 않습니다.

### 입력 패널/시트

기존 `SequentialTransactionForm`을 페이지가 아니라 패널 안에서 재사용합니다. 저장 후에는 패널을 닫지 않고 연속 입력을 지원하며, 부모 화면에는 요약과 목록 재조회 콜백을 전달합니다. 데스크톱은 우측 패널, 모바일은 하단 시트로 배치합니다.

### 기존 라우트 정책

기존 상세 URL은 `/budget/monthly?view=detail&year=YYYY&month=M`로 연결합니다. 기존 입력 URL은 `/budget/monthly?input=open&year=YYYY&month=M`로 연결해, 외부 링크나 브라우저 기록에서 진입해도 같은 월 컨텍스트에서 입력 패널이 열리게 합니다.

### 검증 기준

API route 테스트와 hook/component 테스트를 추가하거나 갱신합니다. 구현 후 `pnpm test`, `pnpm lint`, 필요 시 `NEXT_TURBOPACK_EXPERIMENTAL_USE_SYSTEM_TLS_CERTS=1 pnpm build`를 실행하고, 작은 화면/다크 모드 수동 체크를 문서에 남깁니다.

## Tasks

| 순서 | 상태    | Task                    | 완료 기준                                                                                                           |
| ---- | ------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------- |
| 1    | 완료    | M003 계획 문서화        | 마일스톤 상세 문서와 `docs/project-status.md`가 M003 범위, goal, task를 가리킨다                                    |
| 2    | 완료    | 거래 목록 API 추가      | `GET /api/transactions`가 월별/기간별 거래 목록과 사용 가능한 월 범위를 반환하고 validation/error 테스트가 통과한다 |
| 3    | 완료    | mock 경유 제거          | 상세 목록과 추천 로직이 `apiClient.transactions` 조회를 사용하고 기존 테스트가 통과한다                             |
| 4    | 완료    | 월간 허브 컨테이너 구성 | `/budget/monthly`에서 `요약`/`거래 목록` 탭 전환이 query state와 동기화된다                                         |
| 5    | 완료    | 상세 테이블 통합        | 기존 `MonthlyDetailTable`이 월간 허브 안에서 중복 헤더 없이 동작하고 인라인 입력 저장 후 목록이 갱신된다            |
| 6    | 완료    | 입력 패널/시트 추가     | `거래 추가`가 페이지 이동 없이 추천 기반 입력 패널을 열고 저장 후 요약/목록이 갱신된다                              |
| 7    | 완료    | 기존 라우트 호환 처리   | `/budget/monthly/detail`, `/budget/monthly/input` 직접 진입이 새 허브 URL로 자연스럽게 연결된다                     |
| 8    | 대기    | 반응형/다크 모드 정리   | 모바일/데스크톱/다크 모드에서 탭, 패널, 표, CTA의 겹침이 없다                                                       |
| 9    | 진행 중 | 검증 및 문서 갱신       | 자동 검증과 수동 체크 결과가 `docs/project-status.md`와 관련 문서에 기록된다                                        |
| 10   | 완료    | 거래 추가 CTA 위치 조정 | `거래 추가` 버튼이 월 선택 헤더가 아니라 `요약`/`거래 목록` 탭 행 우측에 표시된다                                   |

## 트러블슈팅

| 일시       | 문제                                    | 원인                                               | 처리                                                                                      |
| ---------- | --------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| 2026-05-09 | 기본 build 실패                         | Google Fonts 네트워크 fetch 실패                   | 네트워크 허용 후 `NEXT_TURBOPACK_EXPERIMENTAL_USE_SYSTEM_TLS_CERTS=1 pnpm build`로 재검증 |
| 2026-05-09 | 요약/거래 목록 전환 시 라우터 갱신 반복 | local state와 URL query를 effect로 양방향 동기화함 | 자동 URL 동기화 effect를 제거하고 탭/패널/월 변경 이벤트에서만 `router.replace` 실행      |

## ADR

- 없음
