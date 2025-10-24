# Electron E2E Runner Decision Record

Status: Final
Date: 2025-10-02

## Executive Summary

Playwright의 `_electron` 런처를 기본 E2E 실행기로 채택한다. 기존 Playwright 브라우저 테스트 자산과 동일한 테스트 인터페이스를 활용할 수 있고, UI 중심 시나리오를 최소한의 마이그레이션으로 Electron 환경에 이식할 수 있기 때문이다. WebDriverIO 및 커스텀 드라이버는 백업/향후 확장 옵션으로 문서화한다.

## Evaluation Criteria

| 항목 | Playwright `_electron` | WebDriverIO Electron Service | 커스텀 드라이버 (child_process + IPC) |
| --- | --- | --- | --- |
| 유지보수/커뮤니티 | Playwright core 팀 유지, Electron 공식 문서에 Experimental 표기 | Electron 가이드에서 소개, 커뮤니티 플러그인 풍부 | 자체 유지 필요 |
| API 안정성 | Experimental. 하지만 Playwright 테스팅 패턴과 동일 | Stable. WebDriver 프로토콜 기반 | 직접 관리. 안정성 전적으로 팀 책임 |
| 로컬 실행 단순성 | 기존 Playwright CLI/Config 재사용. 개발자 학습 비용 최소 | 신규 CLI/Config 도입 필요 | 런처/IPC 관리 스크립트 직접 구현 |
| UI 시나리오 재사용 | 기존 `apps/gui/e2e/*.e2e.test.ts` 로직을 변형 없이 대부분 포팅 | 셀렉터/헬퍼 전면 재작성 필요 | 전면 재작성, 프레임워크 지원 없음 |
| 아티팩트 수집 | Playwright 내장 스크린샷/trace API 활용 | WebDriverIO 서비스/Reporter 설정 필요 | 직접 구현 |
| 멀티 플랫폼 확장 | Electron 빌드만 준비되면 동일 CLI로 실행 가능 | 동일 | OS 별 경로 관리 직접 구현 |
| 팀 학습 곡선 | 매우 낮음 (이미 Playwright 사용 중) | 중간 (새 Runner 학습) | 높음 (전체 사용자 정의) |
| 리스크 | Experimental 표기 → 장기 지원 모니터링 필요 | 셋업 복잡, 기존 자산 재사용 어려움 | 유지보수 비용 과도 |

## Decision

- **Primary Runner**: Playwright `_electron`
- **Rationale**: 기존 Playwright 테스트 인터페이스에 익숙한 팀 구성원이 UI 플로우를 빠르게 이식할 수 있고, 브라우저 모드 테스트와 공통 유틸을 공유할 수 있다. 실험적 표기는 향후 릴리스 노트를 모니터링하면서 보조 실행기 후보(WebDriverIO) 평가를 지속한다.
- **Fallback Plan**: `_electron` API에 치명적 회귀가 발생하면 WebDriverIO 전환을 재검토할 수 있도록 본 문서와 계획서에 비교 결과를 보존한다.

## Follow-up Actions

1. Electron E2E Automation 작업 기록의 Todo #1을 완료 처리하고, 나머지 단계(런처 구성, 시나리오 포팅)를 진행한다.
2. `playwright.config.ts`를 Electron 전용 프로젝트로 재구성하고, 브라우저 모드는 `test:e2e:browser` 스크립트로 분리한다.
3. `package.json`과 개발자 문서에 `pnpm --filter @agentos/apps-gui test:e2e`가 Electron 테스트를 실행한다는 사실을 반영한다.
4. 백엔드 서비스(NestJS/MCP) 기동/종료 및 시드 데이터를 포함한 오케스트레이션 스크립트를 작성해 전체 스택이 한 번에 실행되도록 한다.
