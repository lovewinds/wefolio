# Verification Log

최종 갱신: 2026-06-04

검증 이력은 최신순으로 기록합니다. 마일스톤 문서에는 해당 마일스톤의 대표 검증만 요약하고, 누적 로그는 이 문서를 기준으로 확인합니다. 검증 이력의 일시는 `YYYY-MM-DD HH:mm` 형식으로 분 단위까지 남깁니다.

| 일시             | 범위                               | 명령/방법                                                       | 결과 | 비고                                                                                |
| ---------------- | ---------------------------------- | --------------------------------------------------------------- | ---- | ----------------------------------------------------------------------------------- |
| 2026-06-04       | M006 평균단가 입력 UI (incr 3b)    | `pnpm exec tsc --noEmit` / `pnpm lint` / `pnpm test` / `NEXT_TURBOPACK_EXPERIMENTAL_USE_SYSTEM_TLS_CERTS=1 pnpm build` | Pass | 월별 입력 패널 수량형에 평균단가(원화) 필드 추가, 편집 round-trip 시드. 빌드 전 라우트 컴파일(/asset/monthly 포함). Vitest 47 tests |
| 2026-06-04       | M006 평균단가 SSOT 데이터계층 (incr 3a) | `pnpm exec tsc --noEmit` / `pnpm lint` / `pnpm test` / `prisma db push` | Pass | TDD. HoldingValueSnapshot.avgCostKRW 추가, saveMonthlyInput 평균단가 저장·Holding.averageCostKRW 동기화, 타입/검증/리포지토리/시드 반영, dev.db 비파괴 push. Vitest 7 files / 47 tests |
| 2026-06-04       | M006 거래 비권위 격리 (increment 1) | `pnpm exec tsc --noEmit` / `pnpm lint` / `pnpm test`            | Pass | TDD. record()/delete()에서 Holding 재계산 제거, saveMonthlyInput이 최신 스냅샷 수량을 Holding.quantity로 동기화. Vitest 7 files / 46 tests |
| 2026-06-04       | docs-new 디자인 SSOT 개정          | 정적 확인 + grep                                                | Pass | yearMonth→snapshotDate(일자 키, 주 단위 확장), ADR 개정(거래 비권위 유지), prd/README 정합화. 4개 결정 반영 |
| 2026-06-03       | project-status.md 현황판 압축      | 정적 확인                                                       | Pass | baby-assistant 기준으로 재구성: 다음 우선순위 추가, 현재 구현 상태 28행→9행 요약(다음 확인 문서 열), 마일스톤 현황 1행/표 압축, 중복 섹션(알려진 제약·검증 이력·운영 규칙) 제거, 상태 표기 끝으로 이동. M004/M005/M007 상세 문서 신규 생성(Goal 이전). AGENTS "착수 시 생성" 관례 문구 갱신 |
| 2026-06-03       | AGENTS.md 간결화                   | 정적 확인                                                       | Pass | 기술 스택·프로젝트 구조·아키텍처·개발 명령어·데이터베이스·데이터 초기화를 `build-and-dependencies.md`로 이동(프로젝트 구조 트리 최신화), AGENTS는 행동 가이드라인+라우팅+작업/검증/커밋만 유지. `doc-management.md` 책임 표 보강 |
| 2026-06-03       | 문서 관리 전략 재구성              | 정적 확인                                                       | Pass | baby-assistant progressive-disclosure 구조 적용. `doc-management.md`/`current-work.md`/`verification-log.md`/`known-risks.md`/`build-and-dependencies.md`/`work-items/template.md` 신설, `project-status.md` 현황판 축소, `AGENTS.md` 라우팅·워크플로 보강 |
| 2026-06-02       | M008 디자인 시스템 적용            | `pnpm dev` 렌더 확인                                            | Pass | 전 라우트 200, `.shell/.sidebar/.nav-item` 렌더, 컴파일 CSS에 웜 토큰(#fbf9f5/#e07856) 생성, 레거시 클래스 누출 0 |
| 2026-06-02       | M008 디자인 시스템 적용            | `pnpm build`                                                    | Pass | 23개 라우트 정적/동적 생성 성공                                                     |
| 2026-06-02       | M008 디자인 시스템 적용            | `pnpm test`                                                     | Pass | Vitest 7 files, 43 tests                                                            |
| 2026-06-02       | M008 디자인 시스템 적용            | `pnpm exec tsc --noEmit`                                        | Pass | 폰트/토큰/셸/차트 타입 검증                                                         |
| 2026-06-02       | M008 디자인 시스템 적용            | `pnpm lint`                                                     | Pass | 색상 스윕 후 잔여 레거시 색상 유틸리티 0건. `docs-new/` lint 제외                   |
| 2026-05-09 23:16 | M006 입력 패널 검토 흐름 보완      | `NEXT_TURBOPACK_EXPERIMENTAL_USE_SYSTEM_TLS_CERTS=1 pnpm build` | Pass | 기본 sandbox build는 Google Fonts fetch 실패. 네트워크 허용 후 재실행 통과          |
| 2026-05-09 23:15 | M006 입력 패널 검토 흐름 보완      | `pnpm test`                                                     | Pass | Vitest 7 files, 43 tests                                                            |
| 2026-05-09 23:15 | M006 입력 패널 검토 흐름 보완      | `pnpm lint`                                                     | Pass | 소유자별/자산유형별 그룹, localStorage 임시저장 UI 검증                             |
| 2026-05-09 23:15 | M006 입력 패널 검토 흐름 보완      | `pnpm exec tsc --noEmit`                                        | Pass | 입력 패널 상태/로컬 임시저장 타입 검증                                              |
| 2026-05-09 23:08 | M006 월말 자산 입력                | `NEXT_TURBOPACK_EXPERIMENTAL_USE_SYSTEM_TLS_CERTS=1 pnpm build` | Pass | 기본 sandbox build는 Google Fonts fetch 실패. 네트워크 허용 후 재실행 통과          |
| 2026-05-09 23:06 | M006 월말 자산 입력                | `pnpm test`                                                     | Pass | Vitest 7 files, 43 tests                                                            |
| 2026-05-09 23:06 | M006 월말 자산 입력                | `pnpm lint`                                                     | Pass | 월말 입력 패널, API route, 문서 변경 검증                                           |
| 2026-05-09 23:06 | M006 월말 자산 입력                | `pnpm exec tsc --noEmit`                                        | Pass | 월말 입력 API/UI 타입 검증                                                          |
| 2026-05-09 22:17 | 자산 구성 비율 높이 확장           | `pnpm exec tsc --noEmit`                                        | Pass | 차트 카드가 부모 높이를 채우도록 flex/stretch 레이아웃 검증                         |
| 2026-05-09 22:17 | 자산 구성 비율 높이 확장           | `pnpm lint`                                                     | Pass | 고정 차트 높이 제거와 부모 높이 사용 레이아웃 검증                                  |
| 2026-05-09 22:15 | 자산 월별 현황 넓은 화면 레이아웃  | `pnpm exec tsc --noEmit`                                        | Pass | 요약 카드/자산 구성 비율 반응형 배치 변경 타입 검증                                 |
| 2026-05-09 22:15 | 자산 월별 현황 넓은 화면 레이아웃  | `pnpm lint`                                                     | Pass | 요약 카드 1열 배치와 데스크톱 2열 레이아웃 변경 검증                                |
| 2026-05-09 21:56 | M003 거래 추가 CTA 위치 조정       | `pnpm lint`                                                     | Pass | 탭 행 우측 CTA 배치 변경 검증                                                       |
| 2026-05-09 21:52 | M003 탭 전환 라우터 갱신 반복 수정 | `pnpm exec tsc --noEmit`                                        | Pass | 자동 URL 동기화 effect 제거 후 타입 검증                                            |
| 2026-05-09 21:52 | M003 탭 전환 라우터 갱신 반복 수정 | `pnpm lint`                                                     | Pass | 탭/입력/월 변경 이벤트 기반 URL 갱신 검증                                           |
| 2026-05-09 21:52 | M003 탭 전환 라우터 갱신 반복 수정 | `pnpm test`                                                     | Pass | Vitest 6 files, 39 tests                                                            |
| 2026-05-09 21:48 | M003 월간 가계부 흐름 통합         | `NEXT_TURBOPACK_EXPERIMENTAL_USE_SYSTEM_TLS_CERTS=1 pnpm build` | Pass | 최초 build는 Google Fonts 네트워크 fetch 실패. 네트워크 허용 후 재실행 통과         |
| 2026-05-09 21:47 | M003 월간 가계부 흐름 통합         | `pnpm lint`                                                     | Pass | 거래 목록 API, 월간 허브 탭, 입력 패널, redirect route 검증                         |
| 2026-05-09 21:47 | M003 월간 가계부 흐름 통합         | `pnpm test`                                                     | Pass | Vitest 6 files, 39 tests                                                            |
| 2026-05-09 21:40 | M003 계획 수립                     | 정적 문서 확인                                                  | Pass | 월간 가계부 흐름 통합 마일스톤 상세 문서 생성 및 현황판 갱신                        |
| 2026-05-09 21:25 | 가계부 라우트 URL 정리             | `NEXT_TURBOPACK_EXPERIMENTAL_USE_SYSTEM_TLS_CERTS=1 pnpm build` | Pass | root redirect와 `.next` route manifest가 `/budget` 기준임을 확인                    |
| 2026-05-09 21:25 | 가계부 라우트 URL 정리             | 구 경로 문자열 검색                                             | Pass | 소스와 `.next` 산출물에서 기존 가계부 화면 경로 제거 확인                           |
| 2026-05-09 21:20 | 가계부 라우트 URL 정리             | `pnpm test`                                                     | Pass | Vitest 6 files, 34 tests                                                            |
| 2026-05-09 21:20 | 가계부 라우트 URL 정리             | `pnpm lint`                                                     | Pass | `/budget` 라우트 이동과 내부 링크 변경 검증                                         |
| 2026-05-09 21:20 | 가계부 라우트 URL 정리             | 구 경로 문자열 검색                                             | Pass | 기존 가계부 화면 경로 제거 확인                                                     |
| 2026-05-09 21:09 | 연간 통계 라우트 삭제              | `pnpm test`                                                     | Pass | Vitest 6 files, 34 tests                                                            |
| 2026-05-09 21:09 | 연간 통계 라우트 삭제              | `pnpm lint`                                                     | Pass | 라우트 삭제와 네비게이션 링크 제거 검증                                             |
| 2026-05-09 17:59 | M002 수동 확인                     | 브라우저 확인                                                   | Pass | 사용자가 다크 모드/작은 화면 표시가 괜찮음을 확인                                   |
| 2026-05-09 17:52 | M002 자동 테스트                   | `pnpm test`                                                     | Pass | Vitest 6 files, 34 tests                                                            |
| 2026-05-09 17:51 | M002 build                         | `NEXT_TURBOPACK_EXPERIMENTAL_USE_SYSTEM_TLS_CERTS=1 pnpm build` | Pass | 기본 `pnpm build`는 Google Fonts TLS fetch 오류로 실패해 system TLS 옵션으로 재검증 |
| 2026-05-09 17:48 | M002 lint                          | `pnpm lint`                                                     | Pass | 월별 요약 디자인 개선 코드 검증                                                     |
| 2026-05-07 23:02 | 마일스톤 문서 분리 체계            | 정적 문서 확인                                                  | Pass | M001 상세 문서 추가, M001-M006 현황 요약과 운영 규칙 갱신                           |
| 2026-05-06 22:26 | M001 lint                          | `pnpm lint`                                                     | Pass | 기존 `monthly-summary-view.tsx` unused import warning 1건                           |
| 2026-05-06 22:26 | M001 자동 테스트                   | `pnpm test`                                                     | Pass | Vitest 6 files, 34 tests                                                            |
| 2026-05-06 22:06 | 검증 이력 일시 형식 변경           | 정적 문서 확인                                                  | Pass | 검증 이력에 분 단위 시간을 남기도록 형식 변경                                       |
| 2026-05-06 22:05 | 마일스톤 우선순위 변경             | 정적 문서 확인                                                  | Pass | 검증 체계 구축을 M001로 상향하고 기존 기능 마일스톤을 순연                          |
| 2026-05-06 21:50 | project status 추가                | 정적 확인                                                       | Pass | 현재 파일 구조, Prisma schema, route/service/repository 구현을 읽고 문서화          |
