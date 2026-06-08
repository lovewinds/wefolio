# 자산 현황 탭 재구성

최종 갱신: 2026-06-08 21:24

## Summary

- 태스크 ID: `20260608-asset-tabs-restructure`
- 관련 마일스톤: M009 정보구조(IA) 재편 & 신규 인사이트 화면
- Worktree: — (현재 checkout, `.git` 쓰기 제한으로 브랜치 생성 불가)
- Branch: `main`
- Owner: 구현 세션
- Status: `Ready to Merge`

## Goal

- 목표: 자산 현황 영역을 `자산 / 월별 현황 / 자산 상세 / 자산 추이 / 포트폴리오` 탭 구조로 재구성한다.
- 성공 기준: `/asset` 개요, `/asset/monthly` 월별 현황, `/asset/detail` 상세, `/asset/trend` 추이, `/asset/portfolio` 포트폴리오가 같은 월 선택/탭 상단을 공유하고 기존 거래 상세 URL은 상세 탭으로 호환된다.

## Scope

- In scope: 자산 사이드바 하위 메뉴, 상단 자산 탭, 개요/월별/상세/추이/포트폴리오 화면 재배치, 기존 URL redirect, 관련 문서 갱신.
- Out of scope: Prisma schema, API 응답 타입, 외부 시세/환율 연동, 거래 기반 손익 계산.
- 예상 수정 영역: `src/app/(app)/asset`, `src/components/features/asset`, `src/components/features/navigation`, `src/lib/constants.ts`.
- 충돌 주의 영역: 자산 월별 현황 및 M009 IA 문서.

## Context

- 반드시 볼 문서: `docs/product/insights.md`, `docs/milestones/m009-ia-restructure-and-new-insights.md`
- 반드시 볼 코드: `src/components/features/asset/monthly-asset-view.tsx`, `src/components/features/asset/portfolio-analysis-view.tsx`, `src/components/features/asset/asset-trend-view.tsx`
- 디자인 기준: `docs/product/`

## Verification

- 우선 실행: `pnpm lint`, `pnpm exec tsc --noEmit`
- 완료 전 실행: `pnpm test`
- 수동 확인: `docs/manual-checklist.md` 관련 자산 화면 항목

## Progress Log

| 일시 | 내용 | 검증 |
|------|------|------|
| 2026-06-08 21:15 | 자산 탭 재구성 구현 착수, RED 테스트 추가 후 navigation/range helper GREEN 확인 | `pnpm test` 기준선 Pass, targeted Vitest Pass, `pnpm exec tsc --noEmit` Pass |
| 2026-06-08 21:24 | `/asset` 개요, `/asset/monthly` 구성별 분해, `/asset/detail` 통합 상세, 추이 종료월 선택, 포트폴리오 상단 탭 적용 완료 | `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm test`, `NEXT_TURBOPACK_EXPERIMENTAL_USE_SYSTEM_TLS_CERTS=1 pnpm build`, 브라우저 확인 Pass |

## Completion Notes

- 변경 요약: 자산 하위 IA를 `자산 / 월별 현황 / 자산 상세 / 자산 추이 / 포트폴리오`로 재배치하고, 모든 자산 탭에 월 선택+상단 탭을 적용했다.
- 남은 후속 작업: 투자 수익 현황(FR-C1), 기준 데이터 CRUD, 거래 수정 UI는 별도 마일스톤으로 유지한다.
- 통합 시 주의점: `.git` 쓰기 제한으로 브랜치 생성은 실패했으며 현재 checkout에서 구현했다.
