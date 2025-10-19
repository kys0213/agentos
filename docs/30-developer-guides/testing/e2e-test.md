# E2E Test Convention (Playwright)

## 적용 대상

- `apps/gui/e2e/*` - Playwright 기반 웹 GUI E2E 테스트
- 사용자 시나리오 기반 통합 테스트
- 실제 브라우저 환경에서 전체 플로우 검증

## 테스트 철학

### E2E 테스트 목적

- **사용자 관점 검증**: 실제 사용자가 경험하는 플로우
- **통합 검증**: 프론트엔드 + 백엔드 + IPC 전체 스택
- **회귀 방지**: 주요 시나리오가 여전히 작동하는지 확인

### E2E vs Unit 테스트

| 항목 | Unit Test | E2E Test |
|------|-----------|----------|
| 범위 | 단일 함수/클래스 | 전체 사용자 플로우 |
| 속도 | 빠름 (ms) | 느림 (초) |
| 안정성 | 높음 | 중간 (UI 변경에 취약) |
| Mock | 필수 | 최소화 |
| 목표 | 로직 검증 | 사용자 경험 검증 |

## Template 1: 기본 사용자 플로우

```typescript
// apps/gui/e2e/chat-ux.e2e.test.ts
import { test, expect } from '@playwright/test';
import { openManagementView } from './utils/navigation';

test.describe('Chat UX end-to-end', () => {
  test('create agent and chat echo works', async ({ page }) => {
    // 1. 페이지 진입
    await page.goto('/');

    // 2. 관리 뷰 열기
    await openManagementView(page);

    // 3. Agent 생성 플로우
    const navSubagents = page.getByTestId('nav-subagents');
    await expect(navSubagents.first()).toBeVisible();
    await navSubagents.first().click();

    await page.getByTestId('btn-create-agent').click();

    // 4. Agent 정보 입력
    const agentName = `PW Chat Agent ${Date.now()}`;
    await page.getByLabel(/Agent Name/i).fill(agentName);
    await page.getByLabel(/Description/i).fill('Agent for chat UX test');
    await page.getByRole('button', { name: 'Next: Category' }).click();

    // 5. Category 선택
    await page.getByRole('button', { name: /Development.*software engineering/i }).click();
    await page.getByRole('button', { name: 'Next: AI Config' }).click();

    // 6. AI 설정
    const promptArea = page.getByPlaceholder(
      "Enter the system prompt that guides your agent's behavior..."
    );
    await promptArea.fill('You are a helpful verifier bot.');

    // Bridge 선택 (존재하는 경우)
    const bridgeSelect = page.getByLabel('LLM Bridge');
    if (await bridgeSelect.count()) {
      await bridgeSelect.click();
      const firstOption = page.locator('[role="option"]').first();
      if (await firstOption.count()) {
        await firstOption.click();
      }
    }

    // Model 선택 (존재하는 경우)
    const modelSelect = page.getByLabel('Model');
    if (await modelSelect.count()) {
      await modelSelect.click();
      const firstModel = page.locator('[role="option"]').first();
      if (await firstModel.count()) {
        await firstModel.click();
      }
    }

    // 7. Agent 생성 완료
    await page.getByRole('button', { name: 'Next: Agent Settings' }).click();
    await page.getByRole('button', { name: 'Create Agent' }).click();
    await expect(page.getByText(agentName)).toBeVisible();

    // 8. Chat 테스트
    const navChat = page.getByTestId('nav-chat');
    if ((await navChat.count()) > 0) {
      await navChat.click();
    }

    const input = page.getByPlaceholder('Type a message...');
    await input.click();
    await input.fill('Hello from Playwright');
    await input.press('Enter');

    // 9. Echo 응답 확인
    await expect(page.getByText('Echo: Hello from Playwright')).toBeVisible({
      timeout: 5000,
    });
  });
});
```

## Template 2: 다중 단계 플로우

```typescript
import { test, expect } from '@playwright/test';

test.describe('Subagent Creation Flow', () => {
  test('complete subagent creation with all steps', async ({ page }) => {
    // Setup
    await page.goto('/');

    // Step 1: 시작
    await page.getByTestId('btn-new-subagent').click();

    // Step 2: 기본 정보
    await page.getByLabel('Name').fill(`Test Agent ${Date.now()}`);
    await page.getByLabel('Description').fill('E2E test agent');
    await page.getByRole('button', { name: 'Next' }).click();

    // Step 3: 카테고리 선택
    await page.getByRole('button', { name: /Development/i }).click();
    await page.getByRole('button', { name: 'Next' }).click();

    // Step 4: AI 설정
    await page.getByPlaceholder(/system prompt/i).fill('You are helpful.');
    await page.getByRole('button', { name: 'Next' }).click();

    // Step 5: 최종 확인
    await page.getByRole('button', { name: 'Create' }).click();

    // Verification
    await expect(page.getByText(/Agent created/i)).toBeVisible();
  });

  test('cancel during creation returns to list', async ({ page }) => {
    await page.goto('/');

    await page.getByTestId('btn-new-subagent').click();
    await page.getByLabel('Name').fill('Will be cancelled');
    await page.getByRole('button', { name: 'Cancel' }).click();

    // 리스트로 돌아갔는지 확인
    await expect(page.getByTestId('subagent-list')).toBeVisible();
  });
});
```

## 선택자 우선순위 (Selector Priority)

Playwright에서 요소를 찾을 때 다음 순서를 따릅니다:

### 1순위: Test ID (가장 안정적)

```typescript
// ✅ 가장 권장
await page.getByTestId('btn-create-agent');
await page.getByTestId('nav-chat');
```

**권장 이유:**
- UI 텍스트 변경에 영향 없음
- 다국어 지원에 안정적
- 명시적인 테스트 의도

### 2순위: Role + Accessible Name

```typescript
// ✅ 권장
await page.getByRole('button', { name: 'Create Agent' });
await page.getByRole('button', { name: /Next.*Category/i });
await page.getByLabel('Agent Name');
```

**권장 이유:**
- 접근성 준수 자동 검증
- 사용자가 보는 텍스트 기반
- 의미론적으로 명확

### 3순위: Text Content

```typescript
// 🤔 괜찮음 (고유한 텍스트인 경우)
await page.getByText('Echo: Hello from Playwright');
await expect(page.getByText(agentName)).toBeVisible();
```

### 4순위: CSS Selector (지양)

```typescript
// ❌ 지양 (구조 변경에 취약)
await page.locator('.btn-primary').click();
await page.locator('div > button:nth-child(2)').click();
```

**사용 금지 이유:**
- CSS 클래스 변경에 취약
- 구조 변경 시 깨짐
- 의도가 불명확

## 대기(Wait) 전략

### 명시적 대기 (권장)

```typescript
// ✅ 요소가 보일 때까지 대기
await expect(page.getByText('Success')).toBeVisible();

// ✅ 요소가 사라질 때까지 대기
await expect(page.getByText('Loading...')).toBeHidden();

// ✅ 타임아웃 지정
await expect(page.getByText('Slow response')).toBeVisible({ timeout: 10000 });

// ✅ 네트워크 응답 대기
await page.waitForResponse((resp) => resp.url().includes('/api/agents'));
```

### 암묵적 대기 (지양)

```typescript
// ❌ 고정 시간 대기 (비효율적)
await page.waitForTimeout(3000);

// ❌ 너무 짧은 타임아웃
await expect(element).toBeVisible({ timeout: 100 });
```

## 데이터 정리 (Cleanup)

### 테스트별 격리

```typescript
test.describe('Agent Management', () => {
  test.beforeEach(async ({ page }) => {
    // 각 테스트마다 초기 상태
    await page.goto('/');
    await clearAllAgents(page);
  });

  test.afterEach(async ({ page }) => {
    // 테스트 후 정리
    await clearAllAgents(page);
  });

  test('creates agent', async ({ page }) => {
    // 깨끗한 상태에서 시작
  });
});
```

### 테스트 데이터 전략

```typescript
// ✅ 고유 데이터 생성
const agentName = `Test Agent ${Date.now()}`;
const uniqueId = `agent-${Math.random().toString(36)}`;

// ✅ 테스트 후 생성된 데이터 삭제
test('creates and deletes agent', async ({ page }) => {
  const agentName = `Temp Agent ${Date.now()}`;

  // Create
  await createAgent(page, agentName);

  // Use
  await expect(page.getByText(agentName)).toBeVisible();

  // Delete
  await deleteAgent(page, agentName);
});
```

## Utils 함수 활용

### Navigation Utils

```typescript
// apps/gui/e2e/utils/navigation.ts
import type { Page } from '@playwright/test';

export async function openManagementView(page: Page): Promise<void> {
  const navSettings = page.getByTestId('nav-settings');
  if ((await navSettings.count()) > 0) {
    await navSettings.click();
  }
}

export async function navigateToChat(page: Page): Promise<void> {
  const navChat = page.getByTestId('nav-chat');
  await navChat.click();
  await page.waitForURL('**/chat');
}

export async function navigateToSubagents(page: Page): Promise<void> {
  await page.getByTestId('nav-subagents').click();
  await page.waitForURL('**/subagents');
}
```

### Agent Utils

```typescript
// apps/gui/e2e/utils/agent.ts
import type { Page } from '@playwright/test';

export interface AgentConfig {
  name: string;
  description: string;
  category: string;
  systemPrompt: string;
}

export async function createAgent(
  page: Page,
  config: AgentConfig
): Promise<void> {
  await page.getByTestId('btn-create-agent').click();

  await page.getByLabel('Agent Name').fill(config.name);
  await page.getByLabel('Description').fill(config.description);
  await page.getByRole('button', { name: 'Next: Category' }).click();

  await page.getByRole('button', { name: new RegExp(config.category, 'i') }).click();
  await page.getByRole('button', { name: 'Next: AI Config' }).click();

  await page.getByPlaceholder(/system prompt/i).fill(config.systemPrompt);
  await page.getByRole('button', { name: 'Create Agent' }).click();

  await page.waitForURL('**/agents/*');
}

export async function deleteAgent(page: Page, agentName: string): Promise<void> {
  await page.getByText(agentName).click();
  await page.getByTestId('btn-delete-agent').click();
  await page.getByRole('button', { name: 'Confirm' }).click();
}
```

## 스크린샷 및 디버깅

```typescript
test('debug failing test', async ({ page }) => {
  // 각 단계마다 스크린샷
  await page.goto('/');
  await page.screenshot({ path: 'screenshots/step1-home.png' });

  await page.getByTestId('btn-create').click();
  await page.screenshot({ path: 'screenshots/step2-form.png' });

  // 전체 페이지 스크린샷
  await page.screenshot({ path: 'screenshots/full-page.png', fullPage: true });

  // 특정 요소만
  const element = page.getByTestId('result');
  await element.screenshot({ path: 'screenshots/element.png' });
});
```

## 네트워크 검증

```typescript
test('verifies API calls', async ({ page }) => {
  // API 응답 대기
  const responsePromise = page.waitForResponse(
    (resp) => resp.url().includes('/api/agents') && resp.status() === 200
  );

  await page.getByTestId('btn-create-agent').click();

  const response = await responsePromise;
  const data = await response.json();

  expect(data).toHaveProperty('id');
  expect(data.status).toBe('created');
});

test('handles API errors gracefully', async ({ page }) => {
  // API 에러 시뮬레이션
  await page.route('**/api/agents', (route) => {
    route.fulfill({
      status: 500,
      body: JSON.stringify({ error: 'Server error' }),
    });
  });

  await page.getByTestId('btn-create-agent').click();

  // 에러 메시지 표시 확인
  await expect(page.getByText(/error/i)).toBeVisible();
});
```

## 병렬 실행 고려사항

```typescript
// playwright.config.ts
export default defineConfig({
  // 병렬 실행 설정
  workers: process.env.CI ? 2 : 4,

  // 테스트 간 격리
  fullyParallel: true,

  // 재시도 설정
  retries: process.env.CI ? 2 : 0,
});
```

### 병렬 안전 테스트 작성

```typescript
// ✅ 고유한 데이터로 충돌 방지
test('parallel safe', async ({ page }) => {
  const uniqueName = `Agent ${Date.now()}-${Math.random()}`;
  await createAgent(page, { name: uniqueName });
});

// ❌ 공유 상태 사용 (병렬 실행 시 충돌)
test('not parallel safe', async ({ page }) => {
  await createAgent(page, { name: 'Fixed Name' }); // 충돌 가능
});
```

## 실행 명령어

```bash
# 전체 E2E 테스트
pnpm --filter @agentos/apps-gui test:e2e

# Headed 모드 (브라우저 보이기)
pnpm --filter @agentos/apps-gui test:e2e -- --headed

# 특정 파일만
pnpm --filter @agentos/apps-gui test:e2e chat-ux.e2e.test.ts

# Debug 모드
pnpm --filter @agentos/apps-gui test:e2e -- --debug

# UI 모드 (인터랙티브)
pnpm --filter @agentos/apps-gui test:e2e -- --ui
```

## 체크리스트

E2E 테스트 작성 시 확인사항:

- [ ] 사용자 시나리오가 명확한가?
- [ ] Test ID를 우선 사용했는가?
- [ ] 고정 대기(waitForTimeout) 없이 작성했는가?
- [ ] 테스트 데이터가 고유한가? (병렬 실행 안전)
- [ ] 성공/실패 케이스 모두 커버했는가?
- [ ] Utils 함수로 중복 제거했는가?
- [ ] 테스트 후 정리(cleanup)가 되는가?

## 참고 문서

- [Playwright 공식 문서](https://playwright.dev)
- [Testing Guide](../../../docs/30-developer-guides/testing.md)
- [Electron E2E Test](./electron-e2e-test.md)
