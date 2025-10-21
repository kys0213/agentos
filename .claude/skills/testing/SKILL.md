---
name: testing
description: Automate test writing for AgentOS project with proper conventions. Applies layer-specific test patterns (Unit/E2E/Electron-E2E) based on code location and generates consistent test code following Given-When-Then structure.
---

# Testing Skill

## Description

AgentOS 프로젝트의 테스트 작성을 자동화합니다. 코드 위치를 분석하여 적절한 테스트 타입을 판단하고, 프로젝트 컨벤션에 맞는 테스트 코드를 생성합니다.

**이 스킬이 실행되는 경우:**
- "테스트 작성해줘", "테스트 코드 만들어줘"
- 특정 파일 테스트 요청: "src/tool/mcp/service.ts 테스트 작성"
- 기능 구현 완료 후 테스트 필요 시

## Workflow

### 1. 테스트 대상 식별
- 사용자가 지정한 파일/함수/클래스 확인
- 코드 위치 분석 (`packages/`, `apps/` 구분)
- 기존 테스트 파일 존재 여부 확인

### 2. 테스트 타입 자동 판단

코드 위치에 따라 적절한 테스트 가이드를 선택합니다:

#### Unit Test
**대상:**
- `packages/core/src/common/*` - 순수함수, 유틸리티
- `packages/core/src/*` - 도메인 로직 (Mock 활용)
- `packages/lang/src/*` - 언어 유틸리티

**가이드:** [Unit Test Convention](../../../docs/30-developer-guides/testing/unit-test.md)

#### Playwright E2E Test
**대상:**
- `apps/gui/e2e/*` - 웹 GUI E2E 테스트

**가이드:** [E2E Test Convention](../../../docs/30-developer-guides/testing/e2e-test.md)

#### Electron E2E Test
**대상:**
- `apps/gui/electron-e2e/*` - Electron 앱 E2E 테스트

**가이드:** [Electron E2E Test Convention](../../../docs/30-developer-guides/testing/electron-e2e-test.md)

### 3. Mock/Fixture 작성
외부 의존성 Mock이 필요한 경우:

**가이드:** [Fixture & Mock Guide](../../../docs/30-developer-guides/testing/fixture-mock.md)

### 4. 테스트 작성 및 검증

1. **파일 생성**
   - Unit: `__tests__/<name>.test.ts` 또는 `<name>.test.ts`
   - E2E: `*.e2e.test.ts`
   - Electron E2E: `*.e2e.spec.ts`

2. **컨벤션 적용**
   - Given-When-Then 구조
   - Mock 초기화 (`beforeEach`)
   - 타입 안전성 (`any` 금지)
   - 구체적 Assertion

3. **검증**
   ```bash
   pnpm test                    # 테스트 실행
   pnpm typecheck              # 타입 체크
   ```

## Decision Matrix

| 코드 위치 | 테스트 타입 | Mock 필요 | 커버리지 | 가이드 |
|----------|------------|-----------|---------|--------|
| `packages/core/src/common/*` | Unit | ❌ | 100% | [Unit Test](../../../docs/30-developer-guides/testing/unit-test.md#template-1-순수함수-pure-functions) |
| `packages/core/src/*` | Unit | ✅ | 90%+ | [Unit Test](../../../docs/30-developer-guides/testing/unit-test.md#template-2-도메인-모듈-with-mocks) |
| `packages/lang/src/*` | Unit | ❌ | 100% | [Unit Test](../../../docs/30-developer-guides/testing/unit-test.md#template-1-순수함수-pure-functions) |
| `apps/gui/e2e/*` | Playwright E2E | ❌ | - | [E2E Test](../../../docs/30-developer-guides/testing/e2e-test.md) |
| `apps/gui/electron-e2e/*` | Electron E2E | ❌ | - | [Electron E2E](../../../docs/30-developer-guides/testing/electron-e2e-test.md) |

## Common Rules

모든 테스트에 적용되는 공통 규칙:

### 필수 구조
```typescript
describe('ComponentName', () => {
  let target: TargetClass;
  let mockDep: MockProxy<Dependency>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockDep = mock<Dependency>();
    target = new TargetClass(mockDep);
  });

  it('should describe expected behavior', async () => {
    // Given - 조건 설정
    mockDep.method.mockResolvedValue(expectedValue);

    // When - 실행
    const result = await target.execute();

    // Then - 검증
    expect(result).toBe(expectedValue);
  });
});
```

### 금지 사항
- ❌ `any` 타입 사용
- ❌ `(obj as any).prop = mock` 패턴
- ❌ 실제 외부 서비스 호출
- ❌ 테스트 간 상태 공유
- ❌ 모호한 Assertion (`toBeTruthy()`)

### 필수 사항
- ✅ Given-When-Then 구조
- ✅ `beforeEach`에서 Mock 초기화
- ✅ 비동기는 `async/await` 사용
- ✅ 구체적 Assertion

## Quick Actions

### 테스트 실행
```bash
# 전체 테스트
pnpm test

# 특정 패키지
pnpm --filter @agentos/core test

# 워치 모드
pnpm --filter <package> test -- --watch

# 커버리지
pnpm test --coverage
```

### 검증
```bash
# 타입 체크
pnpm typecheck

# 린트
pnpm lint
```

## Examples

### Unit Test 예시
```typescript
// packages/core/src/common/utils/__tests__/parseJson.test.ts
import { parseJson } from '../parseJson';

describe('parseJson', () => {
  it('should parse valid JSON', () => {
    expect(parseJson('{"key": "value"}')).toEqual({ key: 'value' });
  });

  it('should return null for invalid JSON', () => {
    expect(parseJson('invalid')).toBeNull();
  });
});
```

### E2E Test 예시
```typescript
// apps/gui/e2e/chat.e2e.test.ts
import { test, expect } from '@playwright/test';

test('sends message and receives response', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('chat-input').fill('Hello');
  await page.getByTestId('chat-input').press('Enter');
  await expect(page.getByText('Echo: Hello')).toBeVisible();
});
```

## 참고 문서

상세한 컨벤션과 예시는 아래 문서를 참조하세요:

- [Unit Test Convention](../../../docs/30-developer-guides/testing/unit-test.md)
- [E2E Test Convention](../../../docs/30-developer-guides/testing/e2e-test.md)
- [Electron E2E Test Convention](../../../docs/30-developer-guides/testing/electron-e2e-test.md)
- [Fixture & Mock Guide](../../../docs/30-developer-guides/testing/fixture-mock.md)
- [Testing Overview](../../../docs/30-developer-guides/testing/README.md)
