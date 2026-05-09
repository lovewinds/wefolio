# Project Status

최종 갱신: 2026-05-09

이 문서는 WeFolio의 현재 구현 상태, 알려진 제약, 마일스톤 현황을 관리하는 기준 문서입니다. 프로젝트 개요와 개발 명령어는 루트 `AGENTS.md`를, 초기 개발 계획은 `ROADMAP.md`를 참고합니다. 단, `ROADMAP.md`는 초기 계획 기준이라 현재 코드와 차이가 있을 수 있으며, 이 문서는 현재 코드 기준 상태를 우선합니다.

## 상태 표기

| 상태      | 의미                                                                      |
| --------- | ------------------------------------------------------------------------- |
| `Done`    | 코드 기준으로 기본 동작이 구현되어 있고 즉시 사용할 수 있음               |
| `Partial` | 구조나 일부 흐름은 있으나 실제 사용을 위해 추가 wiring, UI, 검증이 필요함 |
| `Blocked` | 필수 설정값, 데이터, 외부 연동이 없어 핵심 흐름이 막혀 있음               |
| `Todo`    | 모델이나 문서상 필요하지만 아직 구현되지 않음                             |

## 프로젝트 기준

| 항목             | 현재 값                                                          |
| ---------------- | ---------------------------------------------------------------- |
| 프로젝트명       | `wefolio`                                                        |
| 제품 방향        | 가족의 자산 포트폴리오를 완성해 나가는 가계부 & 자산 관리 서비스 |
| Framework        | Next.js 16 App Router, Turbopack                                 |
| Language / UI    | TypeScript 5, React 19                                           |
| Styling          | Tailwind CSS 4                                                   |
| Database / ORM   | SQLite, Prisma 5                                                 |
| Chart            | Nivo (`@nivo/pie`, `@nivo/line`, `@nivo/bar`)                    |
| Package Manager  | pnpm                                                             |
| 인증/사용자 모델 | MVP 기준 인증 없음, 단일 사용자 기준                             |

## 현재 구현 상태

| 영역                   | 상태      | 현재 구현                                                                                               | 남은 작업/주의점                                                             |
| ---------------------- | --------- | ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| 프로젝트 구조          | `Done`    | `src/app`, `components`, `services`, `repositories`, `lib`, `types`, `prisma`로 계층화되어 있음         | 새 기능은 App/API, Service, Repository 책임 경계를 유지해야 함               |
| 앱 레이아웃/네비게이션 | `Partial` | `(app)` 그룹 레이아웃, 고정 LNB, 다크 모드 토글, 월별 요약/자산 메뉴 제공                                | 루트 `/`는 Welcome 화면이고 실제 앱 진입점과 분리되어 있음                   |
| 공통 UI                | `Partial` | Button, Input, Select, Tabs, Card, Combobox, EmptyState, PageContainer 존재                             | Modal, Toast, ConfirmDialog 등 일반 관리 UI에 필요한 컴포넌트는 부족함       |
| Prisma 스키마          | `Done`    | 예산 거래/카테고리/반복 템플릿과 자산 기관/가족 구성원/계좌/종목/보유/가격/스냅샷/거래 모델 정의        | 마이그레이션 디렉터리는 없고 개발용 `db push` 중심으로 보임                  |
| 데이터 접근 계층       | `Done`    | transaction, category, recurring-template, account, holding repository 구현                             | 복잡한 집계는 일부 service에서 Prisma 직접 호출을 병행함                     |
| 서비스 계층            | `Partial` | transaction, category, dashboard, statistics, account, holding service 구현                             | 통계 서비스는 월/연/카테고리 일부만 있고 주간/기간 분석은 없음               |
| API 응답 형식          | `Partial` | 대부분 `{ success, data, error }` 형태로 응답                                                           | 공통 response helper는 없고 route별로 직접 구성함                            |
| 월별 요약              | `Done`    | `/summary/monthly`에서 DB 기반 월별 수입/지출, 잔액 우선 KPI, 수입/지출 비교, 카테고리 breakdown, 빈 상태 표시 | 반응형/다크 모드 확인은 `docs/manual-checklist.md` 기준으로 회귀 체크         |
| 월별 상세 거래         | `Partial` | `/summary/monthly/detail`에서 거래 테이블, 필터 옵션, 수정/삭제 연결 제공                               | 데이터 로딩이 `fetchDashboardData` 경유라 mock/DB 전환 경로를 명확히 해야 함 |
| 거래 입력              | `Partial` | `/summary/monthly/input`에서 단계형 입력, 저장 직후 목록, 수정/삭제, localStorage 기반 기본값 유지 제공 | 실제 전체 목록 조회 없이 현재 화면에서 저장한 항목 중심으로 동작함           |
| 추천 입력              | `Partial` | 최근 3개월 거래와 반복 템플릿 기반 설명/카테고리/금액 추천 흐름 구현                                    | 최근 거래 조회가 `fetchDashboardData` 경유이며 추천 품질/정확도 검증 필요    |
| 거래 API               | `Partial` | `POST /api/transactions`, `PUT/DELETE /api/transactions/[id]`, `GET /api/transactions/options` 구현     | `GET /api/transactions` 목록 조회와 개별 조회 API는 없음                     |
| 카테고리               | `Partial` | 계층형 카테고리 모델과 `GET /api/categories` flat/grouped 조회 구현                                     | 카테고리 생성/수정/삭제 API와 관리 UI는 없음                                 |
| 반복 템플릿            | `Partial` | Prisma 모델, repository, seed, `GET /api/templates` 조회 구현                                           | 템플릿 CRUD API/UI와 “템플릿 클릭 즉시 거래 생성” UX는 미완성                |
| 연간 통계              | `Todo`    | 현재 전용 라우트와 화면 없음                                                                             | 실제 연간 집계, 차트, 상세 분석 API/UI 구현 필요                             |
| 차트                   | `Partial` | 수입/지출 차트, 카테고리 breakdown, 자산 pie/line chart 컴포넌트 존재                                   | 연간/기간별 통계 차트와 export 기능은 없음                                   |
| 자산 월별 현황         | `Done`    | `/asset/monthly`에서 월별 스냅샷 기반 총자산, 전월 대비, 보유 목록, 리스크 분포 표시                    | 스냅샷 데이터가 없으면 화면이 비어 보일 수 있어 빈 상태 검증 필요            |
| 자산 포트폴리오        | `Done`    | `/asset/portfolio`에서 리스크/자산군 기반 포트폴리오 분석 표시                                          | 리밸런싱 목표나 권장 비중 같은 정책 기능은 없음                              |
| 자산 추이              | `Done`    | `/asset/trend`에서 최근 6개월 기본 범위와 자산 추이 데이터 표시                                         | 사용자가 임의 기간을 선택하는 UX는 추가 검증 필요                            |
| 자산 거래              | `Partial` | `/asset/transactions`에서 매수/매도/배당/이체 거래 조회, 입력, 삭제 흐름 구현                           | 거래 수정 API/UI는 없고, 가격/스냅샷 자동 반영 정책은 제한적임               |
| 자산 기준 데이터 API   | `Partial` | 기관, 계좌, 종목, 구성원, 보유 목록 조회와 일부 생성 API 제공                                           | 기준 데이터 수정/삭제 UI와 전체 CRUD 정책은 미완성                           |
| 자산 가격/스냅샷       | `Partial` | 가격 이력, 계좌 스냅샷, 보유 스냅샷 모델과 월별 조회 서비스 구현                                        | 외부 시세 API 연동 없음, 스냅샷 생성/관리 UX가 명확하지 않음                 |
| 시드 데이터            | `Partial` | `prisma/seed.ts`, `seed-data.ts`, xlsx 기반 seed helper 존재                                            | 실제 실행 검증 이력은 문서화되어 있지 않음                                   |
| 클라이언트 mock 데이터 | `Partial` | `src/lib/mock-data.ts`에 개발/테스트용 dashboard mock 및 fallback 성격의 fetch 함수 존재                | 운영 기준에서는 mock 의존 경로를 제거하거나 명시적으로 분리해야 함           |
| 유효성 검증            | `Partial` | zod 기반 transaction, account, institution, asset-master, holding-transaction, common schema 존재       | route별 에러 메시지와 검증 정책 통일 필요                                    |
| 테스트                 | `Done`    | Vitest + jsdom + React Testing Library 기반 `pnpm test` 스크립트와 service/API route/hook 테스트 존재   | SQLite test DB 통합 테스트와 E2E는 후속 범위                                 |
| 빌드/검증 이력         | `Partial` | `pnpm test`, `pnpm lint` 실행 이력 문서화                                                               | 변경 영향 범위에 맞춰 필요 시 `pnpm build` 이력을 계속 남겨야 함             |

## 알려진 제약과 위험

- 루트 `/`는 기본 Welcome 화면이며, 실제 앱의 주요 화면인 `/summary/monthly`로 redirect하지 않습니다.
- `/summary/monthly/detail`과 추천 로직 일부는 `src/lib/mock-data.ts`의 `fetchDashboardData` 경유로 데이터를 가져옵니다. 실제 DB/API 경로와 mock 경로의 경계가 명확해야 합니다.
- `GET /api/transactions` 목록 조회가 없어 거래 상세 화면과 외부 클라이언트에서 월별/기간별 거래 목록을 직접 조회하기 어렵습니다.
- 카테고리와 반복 템플릿은 조회 중심으로 구현되어 있고, 사용자 관리 UI와 생성/수정/삭제 API가 부족합니다.
- 연간 통계 전용 화면은 현재 제공하지 않으며, 실제 기능 구현 시 라우트와 UI/API 설계가 필요합니다.
- 자산 가격과 월별 스냅샷은 seed 또는 수동 데이터에 의존합니다. 외부 시세 API, 환율 API, 자동 스냅샷 생성 정책은 없습니다.
- 자산 거래 삭제 시 보유 수량/평균단가는 재계산되지만, 과거 스냅샷이나 가격 이력과의 정합성 정책은 명확하지 않습니다.
- 인증, 멀티 유저, 가족 그룹 권한 모델이 없으므로 현재 데이터는 단일 사용자 MVP 전제에 묶여 있습니다.
- README는 create-next-app 기본 내용에 가깝고, 실제 WeFolio 실행/데이터 초기화 안내는 `AGENTS.md`와 이 문서에 더 가깝습니다.
- 자동화 테스트는 mock 기반 단위 테스트, API route 테스트, hook 테스트 중심입니다. 실제 SQLite test DB 통합 테스트와 Playwright E2E는 아직 없습니다.

## 마일스톤 상태 표기

| 상태      | 의미                                             |
| --------- | ------------------------------------------------ |
| `시작 전` | 마일스톤을 아직 실제 작업으로 착수하지 않음      |
| `진행 중` | 목표 달성을 위한 코드/문서 변경이 진행 중임      |
| `완료`    | 정의한 Goal이 완료되었고 검증 이력이 남아 있음   |
| `보류`    | 외부 조건이나 의사결정 대기로 진행을 멈춘 상태임 |

## 마일스톤 현황

### M001. 검증 체계 구축

- 상태: 완료
- 상세 문서: [m001-verification-system.md](./milestones/m001-verification-system.md)
- Goal:
  - [x] Vitest 기반 테스트 환경을 사용할 수 있다
  - [x] 핵심 수입/지출 service 동작을 단위 테스트로 검증할 수 있다
  - [x] 주요 API route의 validation/error response를 테스트로 검증할 수 있다
  - [x] 단계형 거래 입력 hook의 핵심 상태 전이를 테스트로 검증할 수 있다
  - [x] 자동 테스트로 다루기 어려운 주요 화면 검증 기준이 문서화되어 있다
- 진행 이력:
  - 2026-05-06: 목표 5개 중 5개 완료. 테스트 인프라, 자동 테스트, 수동 체크리스트 문서화 완료

### M002. 월별 요약 디자인 개선

- 상태: 완료
- 상세 문서: [m002-monthly-summary-design-refresh.md](./milestones/m002-monthly-summary-design-refresh.md)
- Goal:
  - [x] 월별 요약 상단에서 총수입, 총지출, 잔액의 우선순위가 명확하게 보인다
  - [x] 수입/지출 비교와 카테고리 분석 카드가 데스크톱/모바일에서 자연스럽게 배치된다
  - [x] 거래가 없는 월과 카테고리 데이터가 없는 상태가 깨진 차트 대신 빈 상태로 표시된다
  - [x] 월 이동, 상세 보기, 거래 추가, 카테고리 선택 동작이 기존과 동일하게 유지된다
  - [x] 다크 모드와 작은 화면에서 텍스트, 버튼, 차트 라벨이 겹치지 않는다
- 진행 이력:
  - 2026-05-09: KPI 우선 레이아웃, 차트 카드 재배치, 빈 상태 개선 완료. `pnpm lint`와 `NEXT_TURBOPACK_EXPERIMENTAL_USE_SYSTEM_TLS_CERTS=1 pnpm build` 통과
  - 2026-05-09: 브라우저에서 다크 모드/작은 화면 표시가 괜찮음을 사용자 확인. M002 완료 처리

### M003. 수입/지출 실제 데이터 흐름 정리

- 상태: 시작 전
- 상세 문서: 시작 시 `m003-income-expense-data-flow.md` 생성 예정
- Goal:
  - [ ] 월별/기간별 거래 목록을 API로 직접 조회할 수 있다
  - [ ] 월별 상세 화면이 mock 경유 없이 실제 거래 API 클라이언트를 사용한다
  - [ ] 거래 입력 후 상세/요약 화면의 데이터 갱신 흐름이 검증되어 있다
  - [ ] 루트 `/`의 앱 진입 정책이 결정되어 있다
- 진행 이력:
  - 아직 없음

### M004. 카테고리와 반복 템플릿 관리 완성

- 상태: 시작 전
- 상세 문서: 시작 시 `m004-category-template-management.md` 생성 예정
- Goal:
  - [ ] 카테고리를 생성/수정/삭제할 수 있다
  - [ ] 카테고리 관리 UI에서 계층형 카테고리를 관리할 수 있다
  - [ ] 반복 템플릿을 생성/수정/삭제할 수 있다
  - [ ] 템플릿 목록/관리 UI와 빠른 거래 생성 UX가 연결되어 있다
- 진행 이력:
  - 아직 없음

### M005. 통계 기능 확장

- 상태: 시작 전
- 상세 문서: 시작 시 `m005-statistics-expansion.md` 생성 예정
- Goal:
  - [ ] 연간 통계 화면이 실제 연간 집계 데이터를 표시한다
  - [ ] 월별 수입/지출 추이 차트를 확인할 수 있다
  - [ ] 카테고리별 연간/기간별 분석을 확인할 수 있다
  - [ ] 기간 선택, 증감률, CSV export 필요 여부가 결정되어 있다
- 진행 이력:
  - 아직 없음

### M006. 자산 데이터 관리 안정화

- 상태: 시작 전
- 상세 문서: 시작 시 `m006-asset-data-stabilization.md` 생성 예정
- Goal:
  - [ ] 자산 기준 데이터 수정/삭제 정책과 UI가 정리되어 있다
  - [ ] 자산 거래를 수정할 수 있다
  - [ ] 월별 스냅샷 생성/수정 UX 또는 자동 생성 정책이 결정되어 있다
  - [ ] 가격 이력과 환율 입력/외부 연동 방향이 결정되어 있다
  - [ ] 거래, 보유, 스냅샷 간 정합성 검증 로직이 있다
- 진행 이력:
  - 아직 없음

### M007. 문서 동기화

- 상태: 시작 전
- 상세 문서: 시작 시 `m007-documentation-sync.md` 생성 예정
- Goal:
  - [ ] README가 WeFolio 기준 소개/실행/DB 초기화 문서로 정리되어 있다
  - [ ] `ROADMAP.md`가 현재 구현 상태 기준으로 갱신되거나 archive 처리되어 있다
  - [ ] 기능 구현 시 상태 표, 마일스톤 현황, 상세 문서가 함께 갱신된다
- 진행 이력:
  - 아직 없음

## 검증 이력

| 일시             | 범위                     | 명령/방법      | 결과 | 비고                                                                       |
| ---------------- | ------------------------ | -------------- | ---- | -------------------------------------------------------------------------- |
| 2026-05-09 21:09 | 연간 통계 라우트 삭제    | `pnpm test`    | Pass | Vitest 6 files, 34 tests                                                   |
| 2026-05-09 21:09 | 연간 통계 라우트 삭제    | `pnpm lint`    | Pass | 라우트 삭제와 네비게이션 링크 제거 검증                                    |
| 2026-05-09 17:59 | M002 수동 확인           | 브라우저 확인  | Pass | 사용자가 다크 모드/작은 화면 표시가 괜찮음을 확인                          |
| 2026-05-09 17:52 | M002 자동 테스트         | `pnpm test`    | Pass | Vitest 6 files, 34 tests                                                   |
| 2026-05-09 17:51 | M002 build               | `NEXT_TURBOPACK_EXPERIMENTAL_USE_SYSTEM_TLS_CERTS=1 pnpm build` | Pass | 기본 `pnpm build`는 Google Fonts TLS fetch 오류로 실패해 system TLS 옵션으로 재검증 |
| 2026-05-09 17:48 | M002 lint                | `pnpm lint`    | Pass | 월별 요약 디자인 개선 코드 검증                                            |
| 2026-05-07 23:02 | 마일스톤 문서 분리 체계  | 정적 문서 확인 | Pass | M001 상세 문서 추가, M001-M006 현황 요약과 운영 규칙 갱신                  |
| 2026-05-06 22:26 | M001 lint                | `pnpm lint`    | Pass | 기존 `monthly-summary-view.tsx` unused import warning 1건                  |
| 2026-05-06 22:26 | M001 자동 테스트         | `pnpm test`    | Pass | Vitest 6 files, 34 tests                                                   |
| 2026-05-06 22:06 | 검증 이력 일시 형식 변경 | 정적 문서 확인 | Pass | 검증 이력에 분 단위 시간을 남기도록 형식 변경                              |
| 2026-05-06 22:05 | 마일스톤 우선순위 변경   | 정적 문서 확인 | Pass | 검증 체계 구축을 M001로 상향하고 기존 기능 마일스톤을 순연                 |
| 2026-05-06 21:50 | project status 추가      | 정적 확인      | Pass | 현재 파일 구조, Prisma schema, route/service/repository 구현을 읽고 문서화 |

## 운영 규칙

- `docs/project-status.md`는 현재 구현 상태, 알려진 제약, 마일스톤 현황을 요약하는 현황판으로 유지합니다.
- 마일스톤별 상세 Task, 트러블슈팅, ADR 링크는 `docs/milestones/` 아래 상세 문서에 기록합니다.
- 마일스톤 상세 문서 파일명은 `m{3자리번호}-{영문-kebab-title}.md` 형식을 사용합니다.
- M002 이후 상세 문서는 해당 마일스톤을 실제로 시작할 때 생성합니다.
- 기능 구현이나 제약 해소가 끝나면 이 문서의 상태 표, 마일스톤 현황, 해당 마일스톤 상세 문서를 함께 갱신합니다.
- 검증 이력의 일시는 `YYYY-MM-DD HH:mm` 형식으로 분 단위까지 남깁니다.
- Prisma schema, seed, 데이터 초기화 절차가 바뀌면 DB 관련 안내를 함께 갱신합니다.
- 의존성, Next.js, React, Tailwind, Prisma 버전이 바뀌면 프로젝트 기준 표와 실행 문서를 함께 갱신합니다.
- 문서만 변경한 경우 빌드는 생략할 수 있지만, 코드 동작을 바꾸는 변경은 영향 범위에 맞게 `pnpm lint` 또는 `pnpm build` 검증을 남깁니다.
- 장기적으로 남을 기술 결정은 필요 시 `docs/adr/` 아래 ADR로 분리합니다.
