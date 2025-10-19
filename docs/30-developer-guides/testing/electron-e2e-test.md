# Electron E2E Test Convention

## 적용 대상

- `apps/gui/electron-e2e/*` - Electron 앱 전용 E2E 테스트
- Playwright + Electron Harness를 사용한 통합 테스트
- Main Process + Renderer Process + IPC 전체 스택 검증

## 테스트 철학

### Electron E2E vs Web E2E

| 항목 | Web E2E | Electron E2E |
|------|---------|--------------|
| 환경 | 브라우저 (dev server) | Electron App |
| Main Process | ❌ | ✅ 포함 |
| IPC 통신 | ❌ Mock | ✅ 실제 통신 |
| 파일 시스템 | ❌ | ✅ 실제 파일 |
| 시작 방법 | `page.goto()` | `launchElectronHarness()` |
| 정리 방법 | 자동 | `closeElectronHarness()` 필수 |

## 기본 구조

### Template: Electron E2E Test

```typescript
// apps/gui/electron-e2e/tests/example.e2e.spec.ts
import { expect, test } from '@playwright/test';
import { launchElectronHarness, closeElectronHarness } from '../runner/electronHarness';
import { openManagementView } from '../support/openManagementView';

test('describes user scenario', async () => {
  // 1. Electron 앱 시작
  const harness = await launchElectronHarness();

  try {
    // 2. 테스트 시나리오 실행
    await openManagementView(harness.window);

    const button = harness.window.getByTestId('btn-action');
    await button.click();

    await expect(harness.window.getByText('Success')).toBeVisible();

  } finally {
    // 3. 반드시 정리
    await closeElectronHarness(harness);
  }
});
```

### 핵심 패턴

#### 1. Harness 관리 (필수)

```typescript
test('example', async () => {
  const harness = await launchElectronHarness();

  try {
    // 모든 테스트 로직
  } finally {
    // ⚠️ 반드시 정리 - finally 블록 사용
    await closeElectronHarness(harness);
  }
});
```

**왜 필요한가?**
- Electron 프로세스가 계속 떠있으면 리소스 누수
- 다음 테스트 실행 시 포트 충돌 가능
- CI 환경에서 좀비 프로세스 생성

#### 2. `harness.window` 사용

```typescript
// ✅ 올바름
await harness.window.getByTestId('nav-chat').click();

// ❌ 틀림 - page는 없음
// await page.getByTestId('nav-chat').click();
```

## 실전 예시: Agent 생성 & 채팅

```typescript
import { expect, test } from '@playwright/test';
import { launchElectronHarness, closeElectronHarness } from '../runner/electronHarness';
import { openManagementView } from '../support/openManagementView';

test('Agent 생성 후 채팅 echo 응답을 확인한다', async () => {
  const harness = await launchElectronHarness();

  try {
    // 1. 관리 뷰 열기
    await openManagementView(harness.window);

    // 2. Subagents 탭으로 이동
    const navSubagents = harness.window.getByTestId('nav-subagents');
    await expect(navSubagents.first()).toBeVisible();
    await navSubagents.first().click();

    // 3. Agent 생성 버튼 클릭 (두 가지 경우 처리)
    const createAgentButton = harness.window.getByTestId('btn-create-agent');
    if (await createAgentButton.count()) {
      await createAgentButton.first().click();
    } else {
      // Empty state에서 버튼이 다른 경우
      const emptyTrigger = harness.window.getByRole('button', { name: /Create Agent/i });
      await emptyTrigger.first().click();
    }

    // 4. Agent 기본 정보 입력
    const agentName = `PW Chat Agent ${Date.now()}`;
    await harness.window.getByLabel(/Agent Name/i).fill(agentName);
    await harness.window.getByLabel(/Description/i).fill('Agent for chat UX test');
    await harness.window.getByRole('button', { name: 'Next: Category' }).click();

    // 5. Category 선택
    await harness.window
      .getByRole('button', { name: /Development.*software engineering/i })
      .click();
    await harness.window.getByRole('button', { name: 'Next: AI Config' }).click();

    // 6. AI 설정
    const promptArea = harness.window.getByPlaceholder(
      "Enter the system prompt that guides your agent's behavior..."
    );
    await promptArea.fill('You are a helpful verifier bot.');

    // 7. LLM Bridge 선택 (명시적 대기)
    await harness.window.waitForSelector('[data-testid="select-llm-bridge"]', {
      state: 'visible',
      timeout: 15000,
    });
    const bridgeSelect = harness.window.getByTestId('select-llm-bridge').first();
    await bridgeSelect.click();
    await harness.window.getByRole('option', { name: /e2e/i }).first().click();

    // 8. Model 선택
    await harness.window.waitForSelector('[data-testid="select-llm-model"]', {
      state: 'visible',
      timeout: 15000,
    });
    const modelSelect = harness.window.getByTestId('select-llm-model').first();
    await modelSelect.click();
    await harness.window.getByRole('option').first().click();

    // 9. Agent Settings
    await harness.window.getByRole('button', { name: 'Next: Agent Settings' }).click();
    const activeCard = harness.window
      .getByRole('button', { name: /Auto-participate in conversations/i })
      .first();
    await activeCard.click();
    await expect(activeCard).toHaveClass(/bg-primary\/5/, { timeout: 5000 });

    // 10. Agent 생성 완료
    const submitButton = harness.window.getByTestId('btn-submit-agent');
    await expect(submitButton).toBeEnabled({ timeout: 10000 });
    await submitButton.click();
    await expect(harness.window.getByText(agentName)).toBeVisible();

    // 11. Empty state 사라짐 확인
    const emptyState = harness.window.getByText(/No agents available/i);
    if (await emptyState.count()) {
      await expect(emptyState).toBeHidden({ timeout: 15_000 });
    }

    // 12. 채팅 테스트
    const input = harness.window.getByPlaceholder(/Type a message/i).first();
    await expect(input).toBeVisible({ timeout: 10000 });
    await input.click();
    await input.fill('Hello from Playwright');
    await input.press('Enter');

    // 13. Echo 응답 확인
    await expect(
      harness.window.getByText('E2E response: Hello from Playwright')
    ).toBeVisible({ timeout: 5000 });

  } finally {
    await closeElectronHarness(harness);
  }
});
```

## Electron 특화 패턴

### 1. 동적 로딩 대기

Electron 앱은 IPC 통신 + 파일 로딩으로 느릴 수 있습니다:

```typescript
// ✅ 명시적 selector 대기
await harness.window.waitForSelector('[data-testid="select-llm-bridge"]', {
  state: 'visible',
  timeout: 15000, // Electron은 더 긴 타임아웃 필요
});

// ✅ 요소 활성화 대기
const submitButton = harness.window.getByTestId('btn-submit');
await expect(submitButton).toBeEnabled({ timeout: 10000 });
```

### 2. 조건부 요소 처리

```typescript
// UI 상태에 따라 다른 버튼 표시
const createButton = harness.window.getByTestId('btn-create-agent');
if (await createButton.count()) {
  await createButton.first().click();
} else {
  // Empty state에서는 다른 버튼
  const emptyTrigger = harness.window.getByRole('button', { name: /Create Agent/i });
  await emptyTrigger.first().click();
}
```

### 3. 상태 전환 검증

```typescript
// 클래스 변경으로 활성 상태 확인
const card = harness.window.getByRole('button', { name: /Auto-participate/i });
await card.click();
await expect(card).toHaveClass(/bg-primary\/5/, { timeout: 5000 });

// 요소가 사라졌는지 확인
const emptyState = harness.window.getByText(/No agents available/i);
if (await emptyState.count()) {
  await expect(emptyState).toBeHidden({ timeout: 15_000 });
}
```

## Support Utils

### Navigation Helper

```typescript
// apps/gui/electron-e2e/support/openManagementView.ts
import type { Page } from '@playwright/test';

export async function openManagementView(window: Page): Promise<void> {
  const navSettings = window.getByTestId('nav-settings');
  if ((await navSettings.count()) > 0) {
    await navSettings.click();
  }
}

export async function navigateToChat(window: Page): Promise<void> {
  const navChat = window.getByTestId('nav-chat');
  await navChat.click();
}

export async function navigateToSubagents(window: Page): Promise<void> {
  const navSubagents = window.getByTestId('nav-subagents');
  await navSubagents.first().click();
}
```

### Agent Helper

```typescript
// apps/gui/electron-e2e/support/agent.ts
import type { Page } from '@playwright/test';

export async function createTestAgent(
  window: Page,
  name: string
): Promise<void> {
  // Agent 생성 버튼
  const createBtn = window.getByTestId('btn-create-agent');
  if (await createBtn.count()) {
    await createBtn.first().click();
  } else {
    await window.getByRole('button', { name: /Create Agent/i }).first().click();
  }

  // 기본 정보
  await window.getByLabel(/Agent Name/i).fill(name);
  await window.getByLabel(/Description/i).fill(`Test agent ${name}`);
  await window.getByRole('button', { name: 'Next: Category' }).click();

  // Category
  await window.getByRole('button', { name: /Development/i }).click();
  await window.getByRole('button', { name: 'Next: AI Config' }).click();

  // Prompt
  await window
    .getByPlaceholder(/system prompt/i)
    .fill('You are a test agent.');

  // Bridge & Model
  await window.waitForSelector('[data-testid="select-llm-bridge"]', {
    state: 'visible',
    timeout: 15000,
  });
  await window.getByTestId('select-llm-bridge').first().click();
  await window.getByRole('option', { name: /e2e/i }).first().click();

  await window.waitForSelector('[data-testid="select-llm-model"]', {
    state: 'visible',
    timeout: 15000,
  });
  await window.getByTestId('select-llm-model').first().click();
  await window.getByRole('option').first().click();

  // Submit
  await window.getByRole('button', { name: 'Next: Agent Settings' }).click();
  const submitBtn = window.getByTestId('btn-submit-agent');
  await submitBtn.click();
}
```

## 디버깅

### 스크린샷

```typescript
test('debug test', async () => {
  const harness = await launchElectronHarness();

  try {
    // 각 단계마다 스크린샷
    await harness.window.screenshot({
      path: 'electron-e2e/screenshots/step1.png',
    });

    await harness.window.getByTestId('btn-action').click();

    await harness.window.screenshot({
      path: 'electron-e2e/screenshots/step2.png',
    });

  } finally {
    await closeElectronHarness(harness);
  }
});
```

### Console Logs

```typescript
test('check console errors', async () => {
  const harness = await launchElectronHarness();

  try {
    // Console 메시지 수집
    const messages: string[] = [];
    harness.window.on('console', (msg) => {
      messages.push(`${msg.type()}: ${msg.text()}`);
    });

    // 테스트 실행
    await harness.window.getByTestId('btn-action').click();

    // 에러 확인
    const errors = messages.filter((m) => m.startsWith('error:'));
    expect(errors).toHaveLength(0);

  } finally {
    await closeElectronHarness(harness);
  }
});
```

## 타임아웃 설정

Electron 앱은 브라우저보다 느릴 수 있으므로 여유있는 타임아웃 설정:

```typescript
// playwright.config.ts (electron-e2e 전용)
export default defineConfig({
  timeout: 60000, // 테스트 전체 타임아웃: 60초

  expect: {
    timeout: 10000, // expect 타임아웃: 10초
  },

  use: {
    actionTimeout: 15000, // 액션 타임아웃: 15초
  },
});
```

## 실행 명령어

```bash
# 전체 Electron E2E 테스트
pnpm --filter @agentos/apps-gui test:electron-e2e

# 특정 파일만
pnpm --filter @agentos/apps-gui test:electron-e2e chat-ux.e2e.spec.ts

# Headed 모드 (Electron 창 보이기)
pnpm --filter @agentos/apps-gui test:electron-e2e -- --headed

# Debug 모드
PWDEBUG=1 pnpm --filter @agentos/apps-gui test:electron-e2e
```

## 주의사항

### 1. 반드시 정리 (Critical)

```typescript
// ❌ 잘못된 예 - harness 정리 안함
test('bad example', async () => {
  const harness = await launchElectronHarness();
  await harness.window.getByTestId('btn').click();
  // closeElectronHarness() 호출 안함 → 프로세스 남음
});

// ✅ 올바른 예
test('good example', async () => {
  const harness = await launchElectronHarness();
  try {
    await harness.window.getByTestId('btn').click();
  } finally {
    await closeElectronHarness(harness); // 반드시 정리
  }
});
```

### 2. 충분한 타임아웃

```typescript
// ❌ 너무 짧음
await expect(element).toBeVisible({ timeout: 1000 });

// ✅ Electron 환경 고려
await expect(element).toBeVisible({ timeout: 10000 });
```

### 3. 조건부 요소 처리

```typescript
// ✅ count()로 존재 여부 확인 후 처리
const button = harness.window.getByTestId('optional-button');
if (await button.count()) {
  await button.click();
}
```

## 체크리스트

Electron E2E 테스트 작성 시:

- [ ] `try...finally`로 harness 정리하는가?
- [ ] `harness.window` 사용하는가? (`page` 아님)
- [ ] 타임아웃이 충분한가? (10초 이상)
- [ ] 동적 로딩을 명시적으로 대기하는가?
- [ ] 조건부 요소를 `count()`로 확인하는가?
- [ ] IPC 통신 지연을 고려했는가?
- [ ] Test ID 우선 사용했는가?

## 참고 문서

- [E2E Test Convention](./e2e-test.md)
- [Testing Guide](../../../docs/30-developer-guides/testing.md)
- [Playwright for Electron](https://playwright.dev/docs/api/class-electron)
