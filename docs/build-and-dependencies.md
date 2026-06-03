# Build & Dependencies Guide

최종 갱신: 2026-06-03

빌드 환경, 의존성, 프로젝트 구조·아키텍처, 개발 명령어, 데이터 초기화의 단일 기준 문서입니다. 의존성을 올리기 전에 먼저 읽고, 버전을 바꾸면 이 문서의 Build Environment 표와 `docs/project-status.md` 프로젝트 기준 표를 함께 갱신합니다.

## 기술 스택 / Build Environment

| Item | Version |
|------|---------|
| Node.js | 20.9.0 이상 |
| Package Manager | pnpm 10.30.3 (`packageManager` 고정) |
| Next.js | 16.1.3 (App Router, Turbopack) |
| React / React DOM | 19.2.3 |
| TypeScript | ^5 |
| Tailwind CSS | ^4 (`@tailwindcss/postcss`) |
| Prisma / @prisma/client | ^5.22.0 |
| Database | SQLite (MVP) → PostgreSQL (확장 시) |
| Vitest | ^4.1.5 (jsdom ^29, @testing-library/react ^16) |
| Chart | Nivo ^0.99.0 (`@nivo/core|pie|line|bar`) |
| 기타 | `@tanstack/react-table` ^8, `lucide-react`, `xlsx` ^0.18, `zod` ^4 |

## 프로젝트 구조

```
src/
├── app/
│   ├── (app)/                  # 보호 레이아웃 그룹
│   │   ├── budget/monthly/      # 월간 가계부 허브 (+ detail, input 호환 route)
│   │   └── asset/               # monthly / portfolio / transactions / trend
│   ├── api/                     # REST API routes
│   │   ├── transactions/        # [id], options 포함
│   │   ├── categories/
│   │   ├── dashboard/
│   │   ├── templates/
│   │   └── asset/               # accounts, asset-masters, holdings, institutions,
│   │                            #  members, monthly, monthly-input, transactions, trend
│   └── fonts/
├── components/
│   ├── ui/                      # 기본 UI 프리미티브
│   └── features/                # asset, asset-transaction, budget, charts,
│                                #  navigation, transaction, transaction-input
├── services/                    # 비즈니스 로직 레이어
├── repositories/                # 데이터 접근 레이어 (DB 추상화)
├── hooks/                       # React hooks
├── lib/                         # 유틸리티, 설정 (prisma 클라이언트, validations)
└── types/                       # TypeScript 타입 정의
prisma/                          # schema.prisma, seed.ts, seed-data.ts
```

## 아키텍처

Layered Architecture를 적용하여 DB 교체가 용이하도록 설계:

```
[App Router / API Routes]
        ↓
   [Services]          ← 비즈니스 로직
        ↓
 [Repositories]        ← 데이터 접근 추상화
        ↓
    [Prisma]           ← ORM
        ↓
  [SQLite/PostgreSQL]
```

## 개발 명령어

```bash
pnpm install          # 의존성 설치
pnpm dev              # 개발 서버 실행 (Turbopack)
pnpm build            # 프로덕션 빌드
pnpm start            # 프로덕션 서버 실행
pnpm lint             # ESLint 검사
pnpm lint:fix         # ESLint 자동 수정
pnpm format           # Prettier 포맷팅
pnpm format:check     # Prettier 포맷 검사
```

## 데이터베이스

```bash
pnpm prisma generate     # Prisma 클라이언트 생성
pnpm prisma db push      # 스키마를 DB에 반영 (개발용)
pnpm prisma migrate dev  # 마이그레이션 생성 및 적용
pnpm prisma studio       # Prisma Studio 실행
```

- `prisma` + `@prisma/client` 5.x. SQLite(MVP) 기준이며 확장 시 PostgreSQL 전제.
- 개발은 `pnpm prisma db push` 중심이고, 별도 마이그레이션 디렉터리는 두지 않습니다. schema 변경 시 기존 dev DB와의 정합성에 유의합니다.

## 데이터 초기화

### 처음 시작할 때

```bash
# 1. 의존성 설치
pnpm install

# 2. 환경 변수 설정 (.env 파일 생성)
echo 'DATABASE_URL="file:./dev.db"' > .env

# 3. 데이터베이스 스키마 반영 및 시드 데이터 삽입
pnpm prisma db push
pnpm db:seed
```

### 시드 데이터 명령어

```bash
pnpm db:seed   # 시드 데이터 삽입 (카테고리, 거래, 자산, 템플릿)
pnpm db:reset  # DB 초기화 후 시드 데이터 재삽입
```

### 시드 데이터 파일

- `prisma/seed-data.ts` — 시드 데이터 정의 (카테고리·거래·자산·템플릿)
- `prisma/seed.ts` — 시드 스크립트 (데이터 삽입 로직)
- `src/lib/mock-data.ts` — 클라이언트 사이드 Mock 데이터 (개발/테스트용)
- xlsx 기반 seed helper

## Dependencies

### Chart (Nivo)

- `@nivo/pie`, `@nivo/line`, `@nivo/bar`(+ `@nivo/core`)로 수입/지출·카테고리 breakdown·자산 pie/line 차트를 구성합니다.
- 디자인 시스템(M008) 적용 후 색상은 웜 팔레트로 재정의되어 있습니다(차트 구조는 Nivo 유지).

### Tests

- Vitest + jsdom + `@testing-library/react` 기반 단위 테스트(`pnpm test`). service / API route / hook 테스트 중심이며, SQLite test DB 통합 테스트와 Playwright E2E는 아직 없습니다.

## 알려진 빌드 이슈

- **Google Fonts TLS fetch 실패**: 기본 `pnpm build`가 sandbox/제한 네트워크에서 Google Fonts fetch 단계에서 TLS 오류로 실패하는 경우가 반복됩니다. 다음과 같이 system TLS 옵션으로 재실행하면 통과합니다:

```bash
NEXT_TURBOPACK_EXPERIMENTAL_USE_SYSTEM_TLS_CERTS=1 pnpm build
```

  검증 이력(`docs/verification-log.md`)에 이 회피책이 반복 등장합니다. build 검증을 남길 때는 이 옵션 사용 여부를 비고에 함께 기록합니다.

## Version Upgrade Checklist

라이브러리 버전을 올릴 때 아래 호환성 체인을 확인합니다.

1. **Next.js** 변경 시 → `eslint-config-next` 버전 일치, React 호환 버전, Turbopack 동작 확인.
2. **React** 변경 시 → `@types/react`/`@types/react-dom`, `@testing-library/react` 호환 확인.
3. **Tailwind** 변경 시 → `@tailwindcss/postcss`와 `globals.css`의 `@theme inline` 시맨틱 토큰 동작 확인.
4. **Prisma** 변경 시 → `prisma`/`@prisma/client` 동시 갱신, `pnpm prisma generate` 후 service/repository 회귀 확인.
5. 모든 의존성 변경 후 → `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm test`, 필요 시 `pnpm build`(위 Google Fonts 옵션 포함) 검증.
6. 버전 변경 시 → 이 문서 Build Environment 표와 `docs/project-status.md` 프로젝트 기준 표를 함께 갱신.
