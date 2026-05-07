# M001. 검증 체계 구축

## 설명

WeFolio의 핵심 수입/지출 흐름을 변경할 때 service, API route, hook 동작을 자동 테스트로 확인할 수 있도록 검증 기반을 만든 마일스톤입니다. 완료 후에는 `pnpm test`로 주요 비즈니스 로직과 입력 상태 전이를 반복 검증할 수 있고, 자동 테스트로 다루기 어려운 주요 화면은 수동 체크리스트로 확인할 수 있습니다.

## Goals

- [x] Vitest 기반 테스트 환경을 사용할 수 있다
- [x] 핵심 수입/지출 service 동작을 단위 테스트로 검증할 수 있다
- [x] 주요 API route의 validation/error response를 테스트로 검증할 수 있다
- [x] 단계형 거래 입력 hook의 핵심 상태 전이를 테스트로 검증할 수 있다
- [x] 자동 테스트로 다루기 어려운 주요 화면 검증 기준이 문서화되어 있다

## Goal 상세

### Vitest 기반 테스트 환경

`package.json`에 `pnpm test`, `pnpm test:watch`, `pnpm test:coverage` 스크립트를 추가하고 `vitest.config.ts`, `vitest.setup.ts`를 구성해 테스트 실행 기반을 마련했습니다. React Testing Library와 jsdom 기반 hook/component 테스트도 실행할 수 있습니다.

### 핵심 수입/지출 service 단위 테스트

거래와 카테고리 service의 핵심 조회/생성/검증 흐름을 mock repository 기반 단위 테스트로 검증합니다. 이를 통해 repository 구현이나 API wiring과 분리된 비즈니스 로직 회귀를 빠르게 확인할 수 있습니다.

### 주요 API route validation/error response 테스트

`POST /api/transactions`, `GET /api/categories` 등 주요 route의 성공 응답, validation 실패, service error 응답을 테스트합니다. route별 에러 형식이 바뀔 때 회귀를 확인하는 기준입니다.

### 단계형 거래 입력 hook 상태 전이 테스트

단계형 거래 입력 hook의 단계 이동, 필드 입력, 선택 단계 skip, 저장 후 초기화 같은 핵심 상태 전이를 테스트합니다. 입력 UX 변경 시 hook의 상태 계약이 유지되는지 확인합니다.

### 주요 화면 수동 검증 기준

`docs/manual-checklist.md`에 월별 요약, 월별 상세, 거래 입력, 자산 월별 현황, 포트폴리오, 자산 추이, 자산 거래 화면의 기본 로딩/빈 상태/주요 액션 확인 항목을 정리했습니다.

## Tasks

| 일시       | Task                                  | 결과                                                                  |
| ---------- | ------------------------------------- | --------------------------------------------------------------------- |
| 2026-05-06 | 검증 체계 우선순위 조정               | `5777cc6`에서 검증 체계 구축을 우선 마일스톤으로 승격                 |
| 2026-05-06 | Vitest 테스트 인프라 추가             | `e4190ca`에서 `pnpm test`, Vitest, jsdom, setup 구성 완료             |
| 2026-05-06 | service/API route/hook 테스트 추가    | `a9d095e`에서 service, API route, 단계형 거래 입력 hook 테스트 추가   |
| 2026-05-06 | M001 검증 상태와 수동 체크리스트 기록 | `107ce14`에서 M001 완료 상태와 `docs/manual-checklist.md` 문서화 완료 |

## 트러블슈팅

| 일시       | 문제              | 원인                           | 처리                                       |
| ---------- | ----------------- | ------------------------------ | ------------------------------------------ |
| 2026-05-06 | lint warning 존재 | 기존 unused import warning 1건 | M001 범위 밖으로 판단하고 검증 이력에 기록 |

## ADR

- 없음
