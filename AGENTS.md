# AGENTS.md

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

## Project-Specific Rules

가족의 자산 포트폴리오를 완성해 나가는 가계부 & 자산 관리 서비스 (We + Portfolio)

### 기술 스택

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Language**: TypeScript 5
- **UI**: React 19
- **Styling**: Tailwind CSS 4
- **Database**: SQLite (MVP) → PostgreSQL (확장 시)
- **ORM**: Prisma 5
- **Chart**: Nivo (@nivo/pie, @nivo/line, @nivo/bar)
- **Package Manager**: pnpm
- **Node.js**: 20.9.0 이상 필요

### 프로젝트 구조

```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx
│   ├── page.tsx
│   ├── transactions/       # 수입/지출 관리
│   ├── assets/             # 자산 현황
│   └── statistics/         # 통계/차트
├── components/             # 재사용 가능한 UI 컴포넌트
│   ├── ui/                 # 기본 UI 컴포넌트
│   └── features/           # 기능별 컴포넌트
├── lib/                    # 유틸리티 및 설정
│   └── prisma.ts           # Prisma 클라이언트
├── services/               # 비즈니스 로직 레이어
├── repositories/           # 데이터 접근 레이어 (DB 추상화)
└── types/                  # TypeScript 타입 정의
```

### 아키텍처

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

### 프로젝트 상태 문서

- `docs/project-status.md`는 현재 구현 상태, 알려진 제약, 마일스톤 현황을 관리하는 기준 문서입니다.
- `docs/milestones/`는 마일스톤별 상세 기록을 관리합니다. 상세 문서에는 마일스톤 설명, Goal 상세, Task 결과, 트러블슈팅, ADR 링크를 기록합니다.
- 마일스톤 상세 문서 파일명은 `m{3자리번호}-{영문-kebab-title}.md` 형식을 사용합니다.
- 새 기능 구현, 리팩토링, 버그 수정 전에 해당 문서의 현재 상태와 알려진 제약을 먼저 확인합니다.
- 기능 구현이나 제약 해소가 끝나면 `docs/project-status.md`의 상태 표, 마일스톤 현황, 해당 마일스톤 상세 문서를 함께 갱신합니다.
- `ROADMAP.md`는 초기 계획 참고용이며, 실제 구현 상태 판단은 코드와 `docs/project-status.md`를 우선합니다.

### 작업 시작 규칙

- "이번에 구현할 내용", "다음 작업", "현재 상태", "마일스톤" 관련 질문은 코드 탐색보다 `docs/project-status.md`를 먼저 기준으로 답합니다.
- 구현에 들어갈 때는 `docs/project-status.md`의 해당 마일스톤과, 존재한다면 `docs/milestones/`의 상세 문서를 확인한 뒤 관련 코드와 작업 트리를 확인합니다.
- M002 이후 마일스톤 상세 문서는 해당 마일스톤을 실제로 시작할 때 생성합니다.
- 기능 구현이나 제약 해소가 끝나면 `docs/project-status.md`의 상태 표, 마일스톤 현황, 검증 이력과 해당 마일스톤 상세 문서를 함께 갱신합니다.
- README의 현재 상태나 주의점과 달라지는 변경이면 `README.md`도 함께 갱신합니다.

### 개발 명령어

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

### 데이터베이스

```bash
pnpm prisma generate  # Prisma 클라이언트 생성
pnpm prisma db push   # 스키마를 DB에 반영 (개발용)
pnpm prisma migrate dev  # 마이그레이션 생성 및 적용
pnpm prisma studio    # Prisma Studio 실행
```

### 데이터 초기화

#### 처음 시작할 때

```bash
# 1. 의존성 설치
pnpm install

# 2. 환경 변수 설정 (.env 파일 생성)
echo 'DATABASE_URL="file:./dev.db"' > .env

# 3. 데이터베이스 스키마 반영 및 시드 데이터 삽입
pnpm prisma db push
pnpm db:seed
```

#### 시드 데이터 명령어

```bash
pnpm db:seed   # 시드 데이터 삽입 (카테고리, 거래, 자산, 템플릿)
pnpm db:reset  # DB 초기화 후 시드 데이터 재삽입
```

#### 시드 데이터 파일

- `prisma/seed-data.ts` - 시드 데이터 정의 (카테고리, 거래, 자산, 템플릿)
- `prisma/seed.ts` - 시드 스크립트 (데이터 삽입 로직)
- `src/lib/mock-data.ts` - 클라이언트 사이드 Mock 데이터 (개발/테스트용)

### 코드 컨벤션

- ESLint + Prettier 사용
- 함수형 컴포넌트 + React Hooks
- named export 선호
- 파일명: kebab-case (예: `transaction-list.tsx`)
- 컴포넌트명: PascalCase (예: `TransactionList`)
- 타입/인터페이스: PascalCase, `I` prefix 없이 사용

### 커밋 컨벤션

- Conventional Commit 스타일 사용
- Co-Authored-By 사용하지 않음
