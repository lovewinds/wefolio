# Project Status

최종 갱신: 2026-06-03

이 문서는 WeFolio의 전체 현황을 빠르게 파악하기 위한 현황판입니다. 진행 중인 작업은 `docs/current-work.md`, 마일스톤별 목표/작업/트러블슈팅은 `docs/milestones/*.md`, 누적 검증 이력은 `docs/verification-log.md`, 장기 제약과 위험은 `docs/known-risks.md`, 문서 운영 규칙은 `docs/doc-management.md`를 확인합니다. 프로젝트 개요와 개발 명령어는 루트 `AGENTS.md`와 `docs/build-and-dependencies.md`를 참고합니다.

## 읽기 순서

| 질문 | 먼저 볼 문서 |
|------|--------------|
| "지금 진행 중인 작업/충돌 위험은?" | [current-work.md](./current-work.md) |
| "전체 상태/다음 우선순위는?" | 이 문서 |
| "특정 마일스톤 상세는?" | `docs/milestones/m###-*.md` |
| "과거 검증 결과는?" | [verification-log.md](./verification-log.md) |
| "장기 제약/위험은?" | [known-risks.md](./known-risks.md) |
| "버전/의존성/빌드 이슈는?" | [build-and-dependencies.md](./build-and-dependencies.md) |

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

## 현재 병렬 작업

- 활성 세션: 없음
- 통합 대기열: 없음
- 충돌 주의 영역: 없음
- 진행 중인 마일스톤: M003(월간 가계부 흐름 통합), M006(자산 데이터 관리 안정화)
- 세부 작업 컨텍스트: 필요 시 `docs/work-items/*.md`에 기록, 현황은 `docs/current-work.md`

## 다음 우선순위

1. M003 마무리: 모바일/데스크톱/다크 모드에서 탭·패널·표·CTA가 겹치지 않도록 반응형 레이아웃 정리(마지막 미완 Goal)
2. M006 재개: 자산 기준 데이터 수정/삭제 UI, 자산 거래 수정, 가격/환율 입력·연동 방향, 거래·보유·스냅샷 정합성 검증
3. M004 착수: 카테고리·반복 템플릿 생성/수정/삭제 API와 관리 UI, 템플릿→빠른 거래 생성 UX

## 현재 구현 상태 요약

| 영역 | 상태 | 요약 | 다음 확인 문서 |
|------|------|------|----------------|
| 앱 구조/네비게이션 | `Partial` | `src/app`·`components`·`services`·`repositories`·`lib`·`types`·`prisma` 계층화. `(app)` 그룹 레이아웃 + 라벨형 사이드바, 월별 요약/자산 메뉴. 루트 `/`는 `/budget/monthly`로 redirect | `docs/build-and-dependencies.md`, [m009](./milestones/m009-ia-restructure-and-new-insights.md) |
| 디자인 시스템/공통 UI | `Partial` | 웜 코랄/크림 토큰 + Pretendard/JetBrains Mono + `@theme inline` 시맨틱 유틸리티 적용(M008). Button/Input/Select/Tabs/Card 등 프리미티브 존재, Modal/Toast/ConfirmDialog 부족 | [m008](./milestones/m008-design-system-migration.md) |
| 데이터/스키마 | `Partial` | 예산(거래/카테고리/반복 템플릿)·자산(Member/Institution/계좌/종목/보유/HoldingSnapshot/CashSnapshot/거래) Prisma 모델, repository, zod 검증 구현. 자산은 docs-new V2 정합(스냅샷 SSOT·일자 키·현재상태 파생·다통화 원통화 보존), 상수 SSOT는 `src/constants/asset.ts`. 개발용 `db push` 중심 | `docs/known-risks.md`, `docs/build-and-dependencies.md` |
| API/서비스 | `Partial` | transaction/category/dashboard/statistics/account/holding 서비스, `{success,data,error}` 응답. 공통 response helper 없음, 통계는 월/카테고리 일부만 | `docs/known-risks.md` |
| 월간 가계부 | `Partial` | `/budget/monthly` 월별 요약(잔액 우선 KPI·수입/지출 비교·카테고리 breakdown·빈 상태), 상세 거래 탭(필터/삭제/인라인), 추천 입력 패널, detail/input 호환 redirect | [m003](./milestones/m003-budget-monthly-flow-integration.md) |
| 카테고리/반복 템플릿 | `Partial` | 계층형 카테고리·반복 템플릿 조회 API(flat/grouped) 구현. CRUD API와 관리 UI 없음 | [m004](./milestones/m004-category-template-management.md) |
| 통계/차트 | `Partial` | 수입/지출·카테고리·자산 Nivo 차트 존재. 연간 통계 전용 화면·집계와 export 없음 | [m005](./milestones/m005-statistics-expansion.md) |
| 자산 관리 | `Partial` | `/asset` monthly(스냅샷 총자산·전월 대비·보유·리스크 + 월말 입력 패널)·portfolio·trend·transactions 구현. 월말 입력 패널은 소유자▸기관 묶음 스텝(은행류='예금' 묶음, 증권류=기관별 묶음, 한 묶음 포커스+진행률, 기관·계좌 맥락 노출)으로 재편. 외부 시세/환율 API 없음, 거래 수정 UI 없음, 정합성 정책 미정 | [m006](./milestones/m006-asset-data-stabilization.md) |
| 테스트/검증 | `Done` | Vitest + jsdom + RTL 기반 service/API/hook 테스트, lint/tsc/build 검증 이력. SQLite 통합 테스트·E2E는 후속 | `docs/verification-log.md`, `docs/manual-checklist.md` |

## 마일스톤 현황

| 마일스톤 | 상태 | 상세 문서 | 최근 기준 |
|----------|------|-----------|-----------|
| M001. 검증 체계 구축 | `완료` | [m001-verification-system.md](./milestones/m001-verification-system.md) | 2026-05-06 Pass |
| M002. 월별 요약 디자인 개선 | `완료` | [m002-monthly-summary-design-refresh.md](./milestones/m002-monthly-summary-design-refresh.md) | 2026-05-09 Pass |
| M003. 월간 가계부 흐름 통합 | `진행 중` | [m003-budget-monthly-flow-integration.md](./milestones/m003-budget-monthly-flow-integration.md) | 2026-05-09 자동 검증 Pass, 모바일/다크 반응형 정리 미완 |
| M004. 카테고리와 반복 템플릿 관리 완성 | `시작 전` | [m004-category-template-management.md](./milestones/m004-category-template-management.md) | CRUD API·관리 UI 미착수 |
| M005. 통계 기능 확장 | `시작 전` | [m005-statistics-expansion.md](./milestones/m005-statistics-expansion.md) | 연간 통계·추이·export 미착수 |
| M006. 자산 데이터 관리 안정화 | `진행 중` | [m006-asset-data-stabilization.md](./milestones/m006-asset-data-stabilization.md) | 2026-05-09 월말 스냅샷 입력 구현. CRUD/정합성/연동 미완 |
| M007. 문서 동기화 | `시작 전` | [m007-documentation-sync.md](./milestones/m007-documentation-sync.md) | README/ROADMAP 정리 미착수 |
| M008. 디자인 시스템 적용 | `완료` | [m008-design-system-migration.md](./milestones/m008-design-system-migration.md) | 2026-06-02 Pass |
| M009. 정보구조(IA) 재편 & 신규 인사이트 화면 | `시작 전` | [m009-ia-restructure-and-new-insights.md](./milestones/m009-ia-restructure-and-new-insights.md) | 2026-06-02 계획 문서만 작성 |

## 상태 표기

| 상태 | 의미 |
|------|------|
| `Done` | 코드 기준으로 기본 동작이 구현되어 있고 즉시 사용할 수 있음 |
| `Partial` | 구조나 일부 흐름은 있으나 실제 사용을 위해 추가 wiring, UI, 검증이 필요함 |
| `Blocked` | 필수 설정값, 데이터, 외부 연동이 없어 핵심 흐름이 막혀 있음 |
| `Todo` | 모델이나 문서상 필요하지만 아직 구현되지 않음 |

마일스톤 상태는 `시작 전`, `진행 중`, `완료`, `보류`를 사용합니다.
