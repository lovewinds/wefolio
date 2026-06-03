# Current Work

최종 갱신: 2026-06-03

이 문서는 작업 조정판입니다. 각 작업의 상세 목표, 성공 기준, 진행 로그는 `docs/work-items/*.md`에 기록하고, 이 문서에는 진행 중인 작업의 소유권과 충돌 위험만 유지합니다.

## Active Sessions

현재 활성 작업 세션 없음.

| Task | Worktree | Branch | Owner | Status | Last Verification |
|------|----------|--------|-------|--------|-------------------|
| — | — | — | — | — | — |

## Integration Queue

대기 중 통합 항목 없음.

| Task | Branch | Required Before Merge | Status |
|------|--------|-----------------------|--------|
| — | — | — | — |

## Conflict Watch

활성 충돌 주의 영역 없음.

| Area | Owner Task | Notes |
|------|------------|-------|
| — | — | — |

## Worktree Convention

- 단일 개발자 선형 흐름에서는 worktree를 생략하고 `main`에서 바로 진행해도 됩니다. 충돌 위험이 큰 대규모 변경에만 worktree를 권장합니다.
- worktree를 쓸 때 기본 저장소(`/Users/ariens/source/wefolio`)의 `main`은 통합 전용으로 유지합니다.
- 작업은 sibling worktree에서 진행합니다: `/Users/ariens/source/wefolio.worktrees/<task-slug>`.
- 브랜치는 `task/<milestone-or-area>-<slug>` 형식을 사용합니다.
- 예시:

```bash
git worktree add ../wefolio.worktrees/m004-category-crud -b task/m004-category-crud main
```

## Operating Rules

- 다단계/여러 모듈에 걸친 작업을 시작할 때 `docs/work-items/template.md`를 복사해 태스크 문서를 만들고, 이 문서의 `Active Sessions`에 등록합니다. 단일 파일의 사소한 수정이나 문서만의 작은 변경은 생략할 수 있습니다.
- 작업 중 상세 진행 로그와 검증 결과는 해당 태스크 문서에만 적습니다.
- `docs/project-status.md`와 `docs/verification-log.md`는 작업 중 수시로 수정하지 않고, 작업/통합 시점에 필요한 내용만 정리합니다.
- 같은 코드 영역이나 전역 문서를 만지는 작업은 `Conflict Watch`에 기록하고, 선후행 관계를 정한 뒤 진행합니다.
- 작업 완료 후 `Integration Queue`를 기준으로 `main`에 순차 병합하고, 병합 후 검증 결과를 `docs/verification-log.md`에 1회 기록합니다.
