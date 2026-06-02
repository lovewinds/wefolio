# M008. 디자인 시스템 적용

## 설명

`docs-new/design/`에 새 디자인 양식(따뜻한 코랄/크림 팔레트, Pretendard + JetBrains Mono, 라이트/다크, 사이드바+탑바 셸, 카드/KPI/테이블 등 컴포넌트 스타일)이 정의되었다. 기존 앱은 Geist 폰트 + zinc/blue/emerald/rose 기반의 임시 스타일을 컴포넌트 전반에 직접 박아 써서 새 디자인과 톤이 달랐다.

이 마일스톤은 **시각 시스템만** 새 디자인에 맞춘다. 현재 정보구조(IA), 라우트, 가계부(FR-D) 기능은 그대로 유지하고, 차트도 Nivo를 유지한 채 색상만 재정의한다. 정보구조 재편과 신규 인사이트 화면(투자 수익 현황, 자산 증가 분해 워터폴)은 범위에서 제외하며 [M009](#)에서 계획만 수립한다.

핵심 전략: 디자인 토큰을 CSS 변수로 이식하고 Tailwind 4 `@theme inline`으로 **시맨틱 색상 유틸리티**(`bg-surface`, `text-ink`, `border-hairline`, `text-accent`, `text-gain/loss` 등)로 노출한다. 토큰이 테마별 자동 스왑되므로 컴포넌트의 `dark:` 색상 변형을 **삭제**하면서 일괄 치환했다.

## Goals

- [x] 디자인 토큰(색상/타이포/라운드/그림자)이 `globals.css`에 이식되고 Tailwind 시맨틱 유틸리티로 노출된다
- [x] 폰트가 Pretendard(본문/디스플레이) + JetBrains Mono(모노)로 교체된다
- [x] 앱 셸(사이드바/탑바 토글/월 선택)이 새 디자인 양식으로 재구성된다 (IA·라우트 유지)
- [x] 공유 UI 프리미티브와 모든 기능 컴포넌트가 시맨틱 토큰으로 치환된다 (`dark:` 색상 변형 제거)
- [x] Nivo 차트가 새 웜 팔레트로 재색칠된다 (라이브러리 교체 없음)
- [x] build/lint/tsc/test 통과, 잔여 레거시 색상 유틸리티 0건

## Goal 상세

### 토큰 기반 (`src/app/globals.css`)

`docs-new/design/lib/colors_and_type.css`의 브랜드 코어/라이트/다크 토큰을 이식했다. 디자인 원본의 `[data-theme="dark"]` 셀렉터를 앱의 기존 `.dark` 클래스 방식(`:root.dark`)으로 변환했고, `prefers-color-scheme` 폴백은 `:root:not(.light):not(.dark)`로 두어 명시적 선택이 우선하게 했다. `@theme inline`로 색상/폰트/라운드 토큰을 유틸리티로 노출했다(`inline` 필수 — 일반 `@theme`는 색을 빌드 시 스냅샷해 `.dark`에 반응하지 않음). 타입 클래스(`.t-*`)와 셸/내비 컴포넌트 클래스(`.shell .sidebar .nav-item .topbar .monthsel .seg .toggle` 등), soft-tint 헬퍼(`.accent-soft/.gain-soft/.loss-soft`)를 추가했다.

### 폰트 (`src/app/layout.tsx`)

`docs-new/fonts/`의 Pretendard 9개 weight `.otf`를 `src/app/fonts/`로 복사하고 `next/font/local`로 로드, JetBrains Mono는 `next/font/google`로 로드했다. Geist를 제거하고 `--font-pretendard`/`--font-jetbrains-mono` 변수를 globals.css의 `--font-display/body/mono`가 소비한다. 인라인 테마 스크립트(`.dark`/`.light` 토글)는 그대로 유지했다.

### 셸 재구성

`(app)/layout.tsx`를 `.shell` 그리드(248px 사이드바 + `.main`)로 바꾸고, `lnb.tsx`를 브랜드 마크 + 라벨형 `.nav-item` + `.seg` 라이트/다크 세그먼트 토글 + 가구 푸터로 재구성했다(NAV_ITEMS·`usePathname` active 로직·테마 토글 메커니즘 유지). `asset-sub-nav`/`period-selector`는 `.toggle`로, `month-selector`는 토큰 색상으로 리스킨했다. `PageContainer`는 중첩 `<main>` 방지를 위해 `<div className="content">`로 변경했다.

### 컴포넌트 스윕

`src/components/ui/*` 8개와 `features/{budget,transaction,transaction-input,asset,asset-transaction,charts,navigation}/*` 및 앱 라우트 페이지를 매핑표(`bg-white`→`bg-surface`, `text-zinc-900`→`text-ink`, `border-zinc-200`→`border-hairline`, primary→`bg-action`/`bg-accent`, emerald→`gain`, rose→`loss` 등)대로 치환하고 `dark:` 색상 변형을 제거했다.

### Nivo 재색칠

`src/lib/chart-theme.ts`에 공유 `nivoTheme`(축/그리드/툴팁을 `var(--ink-subtle)/var(--hairline)/var(--ink)`로)를 만들어 6개 차트에 적용했다. `constants.ts`의 `CHART_COLORS`/`RISK_LEVEL_COLORS`/child 팔레트를 웜톤(gain/accent/loss)으로 교체했다. 단일 총자산 라인·arc 라벨의 파랑/고정 회색은 `var(--accent)`/`var(--ink-subtle)`로 바꿨다. 다중 카테고리 레인보우 데이터 팔레트는 유지했다.

## Tasks

| 일시       | Task                                                              | 결과                                               |
| ---------- | ---------------------------------------------------------------- | -------------------------------------------------- |
| 2026-06-02 | globals.css 토큰 이식 + `@theme inline` + 타입/셸 클래스          | 완료                                               |
| 2026-06-02 | Pretendard/JetBrains Mono 폰트 교체 (`src/app/fonts/` 신설)       | 완료                                               |
| 2026-06-02 | 셸 재구성 (사이드바/탑바 토글/서브내비/월선택 리스킨)            | 완료                                               |
| 2026-06-02 | 공유 UI 프리미티브 8종 치환                                       | 완료                                               |
| 2026-06-02 | Nivo `chart-theme.ts` + constants 웜 팔레트 + 차트 6종           | 완료                                               |
| 2026-06-02 | 기능 컴포넌트/페이지 색상 스윕 (`dark:` 색상 변형 제거)          | 완료, 잔여 레거시 색상 유틸리티 0건                |
| 2026-06-02 | `docs-new/` eslint/prettier ignore 추가                          | 참조 프로토타입 파일 lint 제외                     |

## 트러블슈팅

| 일시       | 문제                                              | 원인                                                       | 처리                                                            |
| ---------- | ------------------------------------------------- | ---------------------------------------------------------- | --------------------------------------------------------------- |
| 2026-06-02 | `pnpm lint`가 `docs-new/`의 프로토타입 JSX에서 다수 오류 | `eslint .`가 CDN 전역(React/window) 기반 참조 파일까지 검사 | `eslint.config.mjs` globalIgnores + `.prettierignore`에 `docs-new` 추가 |
| 2026-06-02 | `db:seed` 실패                                    | seed가 요구하는 `prisma/자산정리v2.xlsx` 부재              | 빈 DB로 진행(빈 상태/셸/테마 시각 확인). 시드는 별도 데이터 필요 |

## ADR

- 없음 (디자인 토큰은 `docs-new/design/lib/colors_and_type.css`를, 컴포넌트 스타일은 `wefolio.css`를 출처로 함)
