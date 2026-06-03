# Known Risks

최종 갱신: 2026-06-03

장기 제약과 위험은 이 문서에서 관리합니다. 현재 작업에 직접 필요한 항목만 읽고, 일반 작업 시작 시에는 `docs/project-status.md`와 `docs/current-work.md`를 우선합니다.

## 상태 표기

| 상태 | 의미 |
|------|------|
| `Active` | 아직 제품/개발 흐름에 영향을 줄 수 있음 |
| `Mitigated` | 완화책이 적용되어 추적만 필요함 |
| `Accepted` | 현재 단계에서 의도적으로 감수함 |

## Risks

| 상태 | 영역 | 위험/제약 | 대응 또는 현재 정책 |
|------|------|-----------|---------------------|
| `Mitigated` | 라우팅 | 루트 `/`는 실제 앱의 주요 화면인 `/budget/monthly`로 redirect됩니다. | 의도된 동작. IA 재편은 M009에서 다룹니다. |
| `Mitigated` | 라우팅 | `/budget/monthly/detail`과 `/budget/monthly/input`은 호환 route로 유지되며 실제 화면은 `/budget/monthly`의 query state에서 열립니다. | 끊긴 링크 방지를 위해 redirect 유지. M009 IA 재편 시 정책 재검토. |
| `Active` | 거래 API | `GET /api/transactions`는 월별/기간별 목록을 제공하지만 개별 거래 조회 API는 아직 없습니다. | 필요 시 개별 조회 API를 추가합니다. |
| `Active` | 카테고리/템플릿 | 카테고리와 반복 템플릿은 조회 중심으로 구현되어 있고, 사용자 관리 UI와 생성/수정/삭제 API가 부족합니다. | M004에서 CRUD API와 관리 UI를 완성합니다. |
| `Active` | 통계 | 연간 통계 전용 화면은 현재 제공하지 않으며, 실제 기능 구현 시 라우트와 UI/API 설계가 필요합니다. | M005 통계 기능 확장에서 다룹니다. |
| `Active` | 자산 데이터 | 자산 가격과 월별 스냅샷은 seed 또는 수동 데이터에 의존합니다. 보유 스냅샷은 월별 입력 패널에서 수동 저장할 수 있지만, 외부 시세 API, 환율 API, 자동 스냅샷 생성 정책은 없습니다. | M006 자산 데이터 안정화에서 외부 연동/자동화 방향을 결정합니다. |
| `Active` | 자산 정합성 | 자산 거래 삭제 시 보유 수량/평균단가는 재계산되지만, 과거 스냅샷이나 가격 이력과의 정합성 정책은 명확하지 않습니다. | M006에서 거래·보유·스냅샷 간 정합성 검증 로직을 정리합니다. |
| `Accepted` | 인증/멀티유저 | 인증, 멀티 유저, 가족 그룹 권한 모델이 없으므로 현재 데이터는 단일 사용자 MVP 전제에 묶여 있습니다. | MVP 단계에서 의도적으로 감수합니다. |
| `Active` | 문서 동기화 | README는 create-next-app 기본 내용에 가깝고, 실제 WeFolio 실행/데이터 초기화 안내는 `AGENTS.md`와 `docs/project-status.md`에 더 가깝습니다. | M007 문서 동기화에서 README를 정리합니다. |
| `Active` | 테스트 범위 | 자동화 테스트는 mock 기반 단위 테스트, API route 테스트, hook 테스트 중심입니다. 실제 SQLite test DB 통합 테스트와 Playwright E2E는 아직 없습니다. | 후속 범위로 추적하며, 화면 검증은 `docs/manual-checklist.md`로 보완합니다. |
