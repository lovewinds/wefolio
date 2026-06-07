# 자산 변화 인사이트 재정의

최종 갱신: 2026-06-08 00:00

## Summary

- 태스크 ID: `20260608-asset-change-insights`
- 관련 마일스톤: M009
- Worktree: `/Users/ariens/source/wefolio.worktrees/<task-slug>` (단일 개발자 기준 선택, 대규모 변경에만 권장)
- Branch: `main`
- Owner: Codex 세션
- Status: `Ready to Merge`

## Goal

- 목표: 월별 스냅샷 정책을 유지하면서 자산 변화 워터폴과 현금화·보유 변화 추정 인사이트를 제공한다.
- 성공 기준:
  - `docs/product/insights.md`와 `docs/product/prd.md`가 FR-C5를 `ΔN=ΔC+ΔV`, `ΔV=ΔP+ΔG` 기준으로 설명한다.
  - 서비스가 현금, 투자 평가액, 보유원금, 미실현손익의 현재값과 전월 대비 변화량을 반환한다.
  - 서비스가 현금→투자 이동, 투자→현금화, 보유 신규/증가/감소/정리를 스냅샷 패턴으로 감지한다.
  - 월별 자산 화면이 확정값과 추정 인사이트를 구분해 표시한다.

## Scope

- In scope: FR-C5 문서 재정의, 자산 월별 집계 확장, 자산 변화 인사이트 UI 추가
- Out of scope: 거래 원장 권위화, 실현손익 계산, 외부 저축액 확정 귀속, 입력 화면 개편, 기준 데이터 CRUD
- 예상 수정 영역: `docs/product/`, `docs/milestones/m009-*.md`, `src/services/holding-service.ts`, `src/types/asset.ts`, `src/components/features/asset/`
- 충돌 주의 영역: 자산 월별 화면과 `holdingValueSnapshotService`

## Context

- 반드시 볼 문서: `docs/product/insights.md`, `docs/product/prd.md`, `docs/product/asset-management.md`, `docs/milestones/m009-ia-restructure-and-new-insights.md`
- 반드시 볼 코드: `src/services/holding-service.ts`, `src/types/asset.ts`, `src/components/features/asset/monthly-asset-view.tsx`
- 디자인 기준: `docs/product/`(화면 작업인 경우)

## Verification

- 우선 실행: `pnpm lint`, `pnpm exec tsc --noEmit`
- 완료 전 실행: `pnpm test`, 필요 시 `NEXT_TURBOPACK_EXPERIMENTAL_USE_SYSTEM_TLS_CERTS=1 pnpm build`
- 수동 확인: `docs/manual-checklist.md` 관련 항목

## Progress Log

| 일시             | 내용                                                               | 검증                                                                                                                                                                                           |
| ---------------- | ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-06-08 00:00 | 작업 시작. FR-C5를 자산 증가 분해에서 자산 변화 분해로 재정의      | 없음                                                                                                                                                                                           |
| 2026-06-08 00:09 | 자산 변화 metrics/현금화 감지/보유 변화 감지와 월별 화면 섹션 구현 | `./node_modules/.bin/eslint .`, `./node_modules/.bin/tsc --noEmit`, `./node_modules/.bin/vitest run`, `NEXT_TURBOPACK_EXPERIMENTAL_USE_SYSTEM_TLS_CERTS=1 ./node_modules/.bin/next build` Pass |

## Completion Notes

- 변경 요약: FR-C5를 `ΔN=ΔC+ΔV`, `ΔV=ΔP+ΔG` 기반 자산 변화 분해로 재정의하고, 거래 없이 확정할 수 없는 실현손익/외부 저축액은 추정하지 않도록 문서화했다. 월별 자산 API 응답에 cash/investment/principal/unrealized metrics와 changeBreakdown을 추가하고, 전체 보기에서 자산 변화 섹션을 표시한다.
- 남은 후속 작업: 멤버 필터별 changeBreakdown 재계산, Nivo 기반 정식 워터폴 차트, `/asset` 자산 개요 탭 재편.
- 통합 시 주의점: `pnpm` 래퍼가 현재 `fetch failed`를 반환해 검증은 로컬 바이너리 직접 실행으로 수행했다. 빌드는 Google Fonts fetch 때문에 네트워크 허용으로 재실행해 통과했다.
