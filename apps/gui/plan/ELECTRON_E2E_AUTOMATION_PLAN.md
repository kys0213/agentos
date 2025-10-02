# Electron E2E Automation Migration Plan

Status: Draft
Last Updated: 2025-10-01

## Requirements

### 성공 조건

- [ ] Playwright/test 종속성 없이 Electron 런타임을 직접 구동하는 E2E 테스트 러너가 준비된다.
- [ ] 대표 사용자 플로우(대시보드 진입, Agent/MCP/Tool 생성, Chat 인터랙션)가 Electron 환경에서 자동으로 검증된다.
- [ ] 새 테스트 러너는 CI와 로컬에서 동일 명령으로 실행 가능하며, 기존 Playwright e2e 스크립트를 대체한다.
- [ ] 관련 문서와 가이드가 Electron 중심 QA 전략으로 갱신된다.

### 사용 시나리오

- [ ] 개발자가 `pnpm --filter @agentos/apps-gui test:e2e:electron` 명령으로 로컬 Electron 앱을 구동하고 시나리오를 검증한다.
- [ ] QA가 CI 아티팩트(스크린샷/로그)를 활용해 Electron 환경의 회귀 여부를 확인한다.
- [ ] 자동 테스트 실패 시 MCP 수동 도구를 사용해 동일 플로우를 재현한다.

### 제약 조건

- [ ] 기존 Playwright 브라우저 스위트를 제거하기 전까지 커버리지 공백이 없어야 한다.
- [ ] Electron 기반 테스트는 OS별 차이를 고려해 크로스 플랫폼(맥/윈도우/리눅스)에서 동작해야 한다.
- [ ] 테스트 프레임워크 변경이 다른 패키지의 빌드/테스트 파이프라인을 깨지 않도록 한다.

## Interface Sketch

```typescript
// electron-e2e/runner.ts (가상 초안)
import { launchElectronApp } from './support/electron-launcher';
import { expect } from 'vitest';

const app = await launchElectronApp({ entry: 'dist/main/main.js' });
const mainWindow = await app.firstWindow();

await mainWindow.waitForLoadState('domcontentloaded');
await mainWindow.click('[data-testid="nav-dashboard"]');
await expect(
  await mainWindow.locator('h1', { hasText: 'Dashboard' }).isVisible()
).toBe(true);

await app.close();
```

## Todo

- [ ] 프레임워크 선택: Spectron 대안(Playwright Electron 모드, electron-driver, custom CDP) 비교 및 결정
- [ ] 기존 Playwright e2e 테스트 자산 목록화 및 재사용 대상 선정
- [ ] Electron 전용 테스트 부트스트랩(런처, 윈도우 핸들링, 공용 utils) 구현
- [ ] 핵심 사용자 플로우(E2E) 시나리오 이식 및 자동화
- [ ] 테스트 실행 스크립트/CI 파이프라인 갱신
- [ ] Playwright/test 종속성 및 브라우저 전용 스크립트 제거
- [ ] 테스트 문서 및 QA 가이드 업데이트

## 작업 순서

1. **조사 & 결정**: 프레임워크 비교 문서화 → Todo 1 완료 (완료 조건: 의사결정 문서 + 리스크 정리)
2. **인프라 구축**: Electron 런처/테스트 헬퍼 작성 → Todo 2,3 완료 (완료 조건: 샘플 테스트가 로컬에서 성공)
3. **시나리오 이식**: 핵심 플로우를 Electron 테스트로 포팅 → Todo 4 완료 (완료 조건: 최소 3개 플로우 자동화)
4. **CI 및 정리**: 스크립트/CI 갱신 후 Playwright/test 제거 → Todo 5,6 완료 (완료 조건: CI green, 종속성 제거)
5. **문서화 & 핸드오프**: QA/개발 문서 업데이트 → Todo 7 완료 (완료 조건: docs/frontend/testing.md 등 갱신)

## Notes

- 디자인 시안(Figma)과 `apps/gui/design/` 샌드박스는 UI/UX의 단일 SSOT로 유지하며, Electron E2E 시나리오도 해당 참조에 맞춰 검증 항목을 정의한다.
