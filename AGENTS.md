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

기술 스택, 프로젝트 구조·아키텍처, 개발 명령어, 데이터 초기화는 `docs/build-and-dependencies.md`를 참고합니다.

### 문서 라우팅

코드의 상세 설명과 문서는 `docs/`에 있습니다. 문서는 progressive disclosure를 기준으로 관리하며, 진입점은 짧게 유지하고 누적 이력과 세부 맥락은 전용 문서로 내려 보냅니다.

- `docs/current-work.md`: 작업 조정판. 활성 세션, worktree/브랜치 소유권, 통합 대기열, 충돌 주의 영역을 확인합니다.
- `docs/work-items/*.md`: 태스크별 목표, 성공 기준, 범위, 진행 로그, 검증 계획. 다단계 작업의 상세 맥락은 여기에 둡니다.
- `docs/project-status.md`: 전체 구현 상태와 마일스톤 현황. "다음 작업", "현재 상태", "마일스톤" 관련 질문에 답할 때 확인합니다.
- `docs/milestones/*.md`: 관련 마일스톤의 Goal, Task, 트러블슈팅, ADR 링크. 구현 대상 마일스톤이 정해진 뒤 필요한 문서만 확인합니다. 파일명은 `m{3자리번호}-{영문-kebab-title}.md` 형식입니다.
- `docs/known-risks.md`: 알려진 장기 제약과 위험. 작업이 해당 위험과 맞닿을 때만 확인합니다.
- `docs/verification-log.md`: 누적 검증 이력. 과거 검증 결과가 필요하거나 새 검증 이력을 추가할 때 확인합니다.
- `docs/build-and-dependencies.md`: 기술 스택, 프로젝트 구조·아키텍처, 개발 명령어·데이터 초기화, 의존성, 알려진 빌드 이슈. 의존성/버전 변경 전에 먼저 확인하고, 바꾸면 함께 갱신합니다.
- `docs/manual-checklist.md`: 자동 테스트로 다루기 어려운 화면 수동 검증 체크리스트.
- `docs/doc-management.md`: 문서별 책임과 갱신 규칙. 문서 구조나 갱신 위치가 헷갈릴 때 확인합니다.
- `docs-new/`: 화면 구성과 UI 흐름, PRD의 단일 기준(디자인 우선). UI·화면 흐름 작업에서 확인합니다.
- `ROADMAP.md`: 초기 계획 참고용. 실제 구현 상태 판단은 코드와 `docs/project-status.md`를 우선합니다.

### 작업 시작 규칙

- "이번에 구현할 내용", "다음 작업", "현재 상태", "마일스톤" 관련 질문은 코드 탐색보다 `docs/current-work.md`(진행 중 작업)와 `docs/project-status.md`(전체 현황)를 먼저 기준으로 답합니다.
- 구현에 들어갈 때는 `docs/current-work.md`에서 활성 세션·충돌 주의 영역을 확인하고, `docs/project-status.md`의 해당 마일스톤과 (존재한다면) `docs/milestones/`의 상세 문서를 본 뒤 관련 코드를 확인합니다. 화면 작업이면 `docs-new/`를 먼저 확인합니다.
- 다단계 작업이나 여러 모듈/화면에 걸친 작업은 `docs/work-items/template.md`를 복사해 태스크 문서를 만들고, `docs/current-work.md`의 `Active Sessions`에 등록합니다. 단일 파일의 사소한 수정이나 문서만의 작은 변경은 생략할 수 있습니다.
- 단일 개발자 선형 흐름에서는 worktree를 생략하고 `main`에서 바로 진행해도 됩니다. 대형 리팩토링, Prisma schema 변경, 여러 화면 동시 작업처럼 충돌 위험이 큰 경우에만 별도 worktree(`task/<milestone-or-area>-<slug>` 브랜치, 기본 경로 `/Users/ariens/source/wefolio.worktrees/<task-slug>`)를 권장합니다.
- 작업 중 상세 진행 로그와 중간 검증 결과는 해당 `docs/work-items/*.md`에 기록합니다. `docs/project-status.md`와 `docs/verification-log.md`는 작업/통합 시점에 필요한 내용만 갱신합니다.
- 마일스톤 상세 문서는 `docs/milestones/`에 두고, 새 마일스톤을 추가할 때 `m000-template.md`를 복사해 생성합니다.
- 기능 구현이나 제약 해소가 끝나면 `docs/current-work.md` 상태를 갱신하고, `docs/project-status.md`의 상태 표·마일스톤 현황, 해당 마일스톤 상세 문서, `docs/verification-log.md`를 함께 갱신합니다. 작은 단발 작업은 영향받은 문서만 갱신합니다.
- 장기적으로 남을 제약이 새로 생기면 `docs/known-risks.md`에 추가합니다.
- README의 현재 상태나 주의점과 달라지는 변경이면 `README.md`도 함께 갱신합니다.

### 화면 구현 워크플로 (디자인 우선)

- 화면(UI·화면 흐름) 작업은 코드부터 작성하지 않습니다. `docs-new/`의 디자인·PRD로 화면 구성을 먼저 검토·확정한 뒤 코드로 구현합니다.
- 순서: ① `docs-new/`에서 대상 화면의 디자인(`docs-new/design/*.jsx`, `WeFolio Dashboard.html`, `design/screenshots/`)과 PRD(`docs-new/prd.md`, `insights.md`, `asset-management.md`, `data-model.md`)를 검토합니다. → ② 화면 구성·상태·인터랙션을 확정합니다. → ③ 확정된 디자인을 코드로 구현합니다.
- 화면 구성의 단일 기준은 `docs-new/`입니다. 구현 중 디자인과 차이가 생기면 디자인 문서를 먼저 갱신한 뒤 코드를 맞춥니다.
- IA 재편과 신규 인사이트 화면(투자 수익 현황, 자산 증가 분해 워터폴)은 M009 계획 문서와 `docs-new/`를 함께 참고합니다.

### 검증

- 일반 변경: `pnpm lint` + `pnpm exec tsc --noEmit`.
- 코드 동작을 바꾸는 변경: 위에 더해 `pnpm test`, 필요 시 `pnpm build`.
- `pnpm build`가 Google Fonts TLS fetch로 실패하면 `NEXT_TURBOPACK_EXPERIMENTAL_USE_SYSTEM_TLS_CERTS=1 pnpm build`로 재실행합니다. 자세한 내용은 `docs/build-and-dependencies.md`의 "알려진 빌드 이슈" 참고.
- 자동 테스트로 다루기 어려운 화면은 `docs/manual-checklist.md` 기준으로 수동 확인합니다.
- 의존성/버전 변경 시 `docs/build-and-dependencies.md`도 함께 갱신합니다.
- 문서만 바꾼 경우 빌드는 필수 아님. 검증 결과는 `docs/verification-log.md`에 최신순으로 남깁니다.

### 코드 컨벤션

- ESLint + Prettier 사용
- 함수형 컴포넌트 + React Hooks
- named export 선호
- 파일명: kebab-case (예: `transaction-list.tsx`)
- 컴포넌트명: PascalCase (예: `TransactionList`)
- 타입/인터페이스: PascalCase, `I` prefix 없이 사용

### 커밋/작업 트리

- 커밋 메시지는 Conventional Commit 스타일을 사용합니다. Co-Authored-By는 사용하지 않습니다.
- 작업 전후 `git status --short`로 기존 변경과 새 변경을 구분합니다.
- worktree를 쓸 때는 기본 저장소의 `main`에서 직접 구현하지 않고, 태스크별 worktree에서 구현한 뒤 `main`에 순차 통합합니다.
- 같은 파일이나 전역 문서를 수정할 가능성이 높은 작업은 동시에 진행하지 않고 `docs/current-work.md`의 `Conflict Watch`에 선후행 관계를 기록합니다.
- 의존성, Prisma schema 변경은 병렬 금지 작업으로 취급하고, 관련 작업을 통합한 뒤 다른 작업을 재개합니다.
- 사용자가 만든 미추적 파일, 로컬 설정, 도구 아티팩트는 요청 없이 삭제하거나 되돌리지 않습니다.
