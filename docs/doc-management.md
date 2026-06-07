# Documentation Management

최종 갱신: 2026-06-03

문서는 progressive disclosure를 기준으로 관리합니다. 기본 진입점은 짧게 유지하고, 누적 이력과 세부 맥락은 필요한 문서로 내려 보냅니다.

## 읽기 순서

1. 현재 진행 중인 작업과 충돌 위험을 확인하려면 `docs/current-work.md`를 봅니다.
2. 전체 현황이나 다음 우선순위를 확인해야 하면 `docs/project-status.md`를 봅니다.
3. 특정 태스크의 상세 목표, 범위, 검증 계획은 `docs/work-items/*.md`를 봅니다.
4. 실제 구현에 들어갈 때는 관련 `docs/milestones/*.md`, 화면 작업이면 `docs/product/`(디자인·PRD), 코드만 추가로 확인합니다.
5. 의존성/빌드 변경 전에는 `docs/build-and-dependencies.md`를 확인합니다.
6. 누적 검증과 장기 위험은 각각 `docs/verification-log.md`, `docs/known-risks.md`에서 확인합니다.

## 문서별 책임

| 문서 | 책임 |
|------|------|
| `docs/current-work.md` | 활성 작업 세션, worktree/브랜치 소유권, 통합 대기열, 충돌 주의 영역 |
| `docs/work-items/*.md` | 태스크별 목표, 성공 기준, 범위, 컨텍스트, 진행 로그, 검증 계획 |
| `docs/project-status.md` | 전체 구현 상태 요약, 마일스톤 현황, 다음 우선순위, 문서 라우팅 |
| `docs/milestones/*.md` | 마일스톤별 Goal, Task, 트러블슈팅, ADR 링크 |
| `docs/verification-log.md` | 누적 검증 이력 |
| `docs/known-risks.md` | 장기 제약, 위험, 수용/완화 상태 |
| `docs/build-and-dependencies.md` | 기술 스택, 프로젝트 구조·아키텍처, 개발 명령어·데이터 초기화, 빌드 환경, 의존성, 알려진 빌드 이슈, 버전 호환성 |
| `docs/manual-checklist.md` | 자동 테스트로 다루기 어려운 화면 수동 검증 체크리스트 |
| `docs/product/` | 화면 구성과 UI 흐름, PRD의 단일 기준(디자인 우선). 스펙(`prd`·`data-model`·`asset-management`·`insights`)과 디자인 프로토타입(`design/`)을 포함 |
| `AGENTS.md` | 행동 가이드라인, 기술 스택, 문서 라우팅, 작업/검증/커밋 규칙 |
| `README.md` | 사용자/개발자용 실행 요약 |

## 갱신 규칙

- 다단계 작업이나 여러 모듈/화면에 걸친 기능·버그 작업을 시작하면 `docs/work-items/template.md`를 복사해 태스크 문서를 만들고, 목표/성공 기준/범위/검증 계획을 기록합니다. `docs/current-work.md`의 `Active Sessions`에 task, (worktree), branch, owner, 상태를 등록합니다.
- 작업 중 상세 진행 로그와 중간 검증 결과는 해당 `docs/work-items/*.md`에 기록합니다.
- `docs/project-status.md`와 `docs/verification-log.md`는 작업 중 수시로 수정하지 않습니다. 작업/통합이 끝나는 시점에 필요한 전역 상태와 대표 검증만 정리합니다.
- 작업이 끝나면 `docs/current-work.md`에서 완료 상태 또는 `Integration Queue`를 갱신하고, 해당 마일스톤 문서와 `docs/verification-log.md`에 대표 결과를 옮깁니다.
- 상태 요약이나 우선순위가 바뀔 때만 `docs/project-status.md`의 상태 표·마일스톤 현황을 갱신합니다.
- 장기적으로 남을 제약이 새로 생기면 `docs/known-risks.md`에 추가합니다.
- 의존성, Next.js, React, Tailwind, Prisma 버전이나 Prisma schema·seed·데이터 초기화 절차가 바뀌면 `docs/build-and-dependencies.md`와 `AGENTS.md` 기술 스택 표, `docs/project-status.md` 프로젝트 기준 표를 함께 갱신합니다.
- README의 실행 방법, 환경 변수, 데이터 초기화 절차가 달라지면 `README.md`도 함께 갱신합니다.
- 장기적으로 남을 기술 결정은 필요 시 `docs/adr/` 아래 ADR로 분리합니다.

## Worktree 운영

- wefolio는 현재 단일 개발자 선형 흐름이므로 worktree는 **선택**입니다. 작은 단발 작업과 문서 변경은 `main`에서 바로 진행해도 됩니다.
- 대형 리팩토링, Prisma schema 변경, 여러 화면을 동시에 건드리는 작업처럼 충돌 위험이 큰 경우에만 별도 worktree 사용을 권장합니다.
- worktree를 쓸 때는 기본 저장소(`/Users/ariens/source/wefolio`)의 `main`을 통합 전용으로 두고, sibling worktree에서 진행합니다: `/Users/ariens/source/wefolio.worktrees/<task-slug>`.
- 브랜치는 `task/<milestone-or-area>-<slug>` 형식을 사용합니다.
- 같은 파일이나 전역 문서를 동시에 수정할 가능성이 높은 작업은 `docs/current-work.md`의 `Conflict Watch`에 선후행 관계를 적습니다.
- 의존성, Prisma schema 변경은 병렬 금지 작업으로 취급하고, 관련 작업을 통합한 뒤 다른 작업을 재개합니다.
