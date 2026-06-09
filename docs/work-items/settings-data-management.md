# 설정 > 데이터 관리 화면 (레이아웃 우선)

최종 갱신: 2026-06-09

## Summary

- 태스크 ID: `20260609-settings-data-management`
- 관련 마일스톤: 없음 (M009 `설정 · 기준 데이터`와 진입점 인접 — 아래 충돌 주의 참고)
- Worktree: 미사용 (`main`에서 직접 진행, 단일 개발자 선형 흐름)
- Branch: `main`
- Owner: 구현 세션
- Status: `In Progress` (Phase 1 레이아웃 완료, Phase 2 백엔드 후속)

## Goal

- 목표: CLI `pnpm db:seed`를 화면으로 끌어올려 상세 데이터를 로드/삭제하고 결과를 보여줄 수 있는 진입점과 화면을 만든다.
- 성공 기준 (Phase 1): LNB `설정` 그룹의 `데이터` 항목으로 `/settings/data` 진입, 로드(파일 업로드)·삭제(도메인별) 레이아웃이 라이트/다크에서 정상 렌더. `pnpm lint`·`tsc --noEmit` 통과.

## Scope

- In scope (Phase 1): LNB `설정` 그룹 + `데이터` 항목, `/settings/data` 페이지, 로드/삭제 레이아웃(placeholder 동작).
- Out of scope (Phase 2 후속): 업로드 xlsx 파싱→삽입 API, 도메인별 일괄 삭제·건수 조회 API, 실제 결과·확인 다이얼로그.
- 예상 수정 영역: `src/lib/constants.ts`, `src/components/features/navigation/lnb.tsx`, `src/components/features/settings/*`, `src/app/(app)/settings/data/page.tsx`.
- 충돌 주의 영역: LNB 내비(`lnb.tsx`/`constants.ts`)와 `설정` 그룹 구성 — M009 `기준 데이터` 항목이 같은 그룹에 들어옴.

## Context

- 반드시 볼 문서: `docs/product/settings.md`(이 화면의 SSOT), `prisma/CLAUDE.md`(도메인 분리).
- 반드시 볼 코드: `lnb.tsx`(그룹/활성 패턴), `src/components/ui`(`Card`/`Button`/`PageContainer`), `prisma/seed.ts`·`prisma/seed/*`(Phase 2 재사용 후보).
- 디자인 기준: `docs/product/design/WeFolio Dashboard.html`(그룹형 LNB), `docs/product/settings.md`.

## Verification

- 우선 실행: `pnpm lint`, `pnpm exec tsc --noEmit`
- 수동 확인: `docs/manual-checklist.md`의 `설정 · 데이터 관리` 항목
- Phase 2 착수 시: `pnpm test`, 필요 시 `NEXT_TURBOPACK_EXPERIMENTAL_USE_SYSTEM_TLS_CERTS=1 pnpm build`

## Progress Log

| 일시 | 내용 | 검증 |
|------|------|------|
| 2026-06-09 | Phase 1 레이아웃 구현: LNB `설정` 그룹+`데이터` 항목, `/settings/data` 로드/삭제 화면 | `pnpm lint`(0) / `pnpm exec tsc --noEmit`(0) / 실행 중 dev 서버 `/settings/data` HTTP 200·콘텐츠 확인 |

## Completion Notes

- 변경 요약: `SETTINGS_NAV_ITEMS` 추가, LNB `설정` 그룹 렌더, `DataManagementView`(업로드 드롭존 + 도메인별 삭제 카드) 신설, `/settings/data` 라우트. UI는 `Card`/`Button`/`PageContainer` 재사용, `globals.css` 미변경.
- 남은 후속 작업: Phase 2 백엔드(로드/삭제 API·건수). 로드 결과·삭제 확인 다이얼로그.
- 통합 시 주의점: M009 착수 시 `설정` 그룹에 `기준 데이터` 항목을 형제로 추가하며 그룹 구성 조정.
