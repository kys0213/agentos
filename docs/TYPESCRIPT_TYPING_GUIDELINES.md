# TypeScript 타이핑 지침

## 🚨 any 타입 사용 금지 원칙

이 프로젝트에서는 **`any` 타입 사용을 절대 금지**합니다. `any`는 TypeScript의 타입 안전성을 무력화시키며, 런타임 오류와 디버깅 어려움을 야기합니다.

## 1. any 대신 사용할 타입들

### 1.1 unknown 타입

외부에서 받아온 데이터나 타입을 알 수 없는 경우:

```typescript
// ❌ 잘못된 예
function processData(data: any) {
  return data.someProperty; // 타입 체크 없음
}

// ✅ 올바른 예
function processData(data: unknown) {
  if (typeof data === 'object' && data !== null && 'someProperty' in data) {
    return (data as { someProperty: unknown }).someProperty;
  }
  throw new Error('Invalid data structure');
}
```

### 1.2 제네릭 타입

재사용 가능한 컴포넌트나 함수에서:

```typescript
// ❌ 잘못된 예
function sendMessage<T>(action: string, payload: any): Promise<any> {
  // ...
}

// ✅ 올바른 예
function sendMessage<T, R>(action: string, payload: T): Promise<R> {
  // ...
}
```

### 1.3 Union 타입

여러 타입 중 하나인 경우:

```typescript
// ❌ 잘못된 예
interface MessageContent {
  content: any;
}

// ✅ 올바른 예
interface MessageContent {
  content: string | object | ArrayBuffer;
}
```

### 1.4 인덱스 시그니처

동적 속성을 가진 객체:

```typescript
// ❌ 잘못된 예
interface Config {
  [key: string]: any;
}

// ✅ 올바른 예
interface Config {
  [key: string]: string | number | boolean | undefined;
}

// 더 나은 예 - 명시적 속성과 함께
interface LlmBridgeConfig {
  name: string;
  type: 'openai' | 'anthropic' | 'local' | 'custom';
  apiKey?: string;
  model?: string;
  [key: string]: unknown; // 확장 가능한 설정
}
```

## 2. 도메인별 타입 정의 가이드

### 2.1 IPC 통신 타입

모든 IPC 메서드는 명확한 입력/출력 타입을 가져야 합니다:

```typescript
// ✅ 올바른 예
interface BridgeService {
  register(id: string, config: LlmBridgeConfig): Promise<{ success: boolean }>;
  getCurrentBridge(): Promise<{ id: string; config: LlmBridgeConfig } | null>;
}

// MCP 도구 실행 인자
interface McpToolArgs {
  [key: string]: string | number | boolean | object | null | undefined;
}
```

### 2.2 API 응답 타입

API 응답은 항상 구체적인 타입을 정의합니다:

```typescript
// ✅ 도구 실행 응답
interface ToolExecutionResponse {
  success: boolean;
  result?: unknown; // 도구별로 다른 응답이므로 unknown 사용
  error?: string;
}

// ✅ 메시지 응답
interface MessageListResponse {
  messages: MessageRecord[];
  total?: number;
  hasMore?: boolean;
  nextCursor?: string;
}
```

## 3. 타입 안전성 검증 패턴

### 3.1 타입 가드 함수

unknown 타입을 안전하게 사용하기 위한 타입 가드:

```typescript
function isLlmBridgeConfig(obj: unknown): obj is LlmBridgeConfig {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'name' in obj &&
    'type' in obj &&
    typeof (obj as any).name === 'string' &&
    ['openai', 'anthropic', 'local', 'custom'].includes((obj as any).type)
  );
}

// 사용 예
function processBridgeConfig(config: unknown) {
  if (isLlmBridgeConfig(config)) {
    // 이제 config는 LlmBridgeConfig 타입으로 안전하게 사용 가능
    console.log(config.name);
  }
}
```

### 3.2 Assertion 함수

타입을 확신할 수 있는 경우:

```typescript
function assertIsString(value: unknown): asserts value is string {
  if (typeof value !== 'string') {
    throw new Error('Expected string');
  }
}

// 사용 예
function processId(id: unknown) {
  assertIsString(id);
  // 이제 id는 string 타입으로 취급됨
  return id.toUpperCase();
}
```

## 4. 레거시 코드 마이그레이션

### 4.1 단계별 접근법

1. **타입 정의 먼저**: 새로운 구체적 타입들을 core-types.ts에 정의
2. **인터페이스 업데이트**: 공개 인터페이스부터 any 제거
3. **구현체 업데이트**: 각 구현체에서 구체적 타입 사용
4. **테스트 및 검증**: 타입 에러 수정 및 동작 확인

### 4.2 Deprecated 함수 처리

기존 함수와의 호환성이 필요한 경우:

```typescript
/**
 * @deprecated Use bridgeService.register() instead
 */
async register(id: string, config: LlmBridgeConfig): Promise<void> {
  console.warn('BridgeManager.register() is deprecated');
  // 구체적 타입 사용하되 기존 동작 유지
}
```

## 5. ESLint 규칙 설정

`.eslintrc.js`에 다음 규칙을 추가하여 any 사용을 방지:

```javascript
module.exports = {
  rules: {
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unsafe-assignment': 'error',
    '@typescript-eslint/no-unsafe-call': 'error',
    '@typescript-eslint/no-unsafe-member-access': 'error',
    '@typescript-eslint/no-unsafe-return': 'error',
  },
};
```

## 6. 코드 리뷰 체크리스트

Pull Request 시 다음 사항을 확인:

- [ ] 새로운 `any` 타입이 추가되지 않았는가?
- [ ] `unknown` 사용 시 적절한 타입 가드가 있는가?
- [ ] 인터페이스에 구체적인 타입이 정의되어 있는가?
- [ ] 제네릭을 사용할 수 있는 곳에서 `any` 대신 제네릭을 사용했는가?
- [ ] 외부 라이브러리 타입이 누락되지 않았는가?

## 7. 예외 상황 처리

### 7.1 외부 라이브러리

타입 정의가 없는 외부 라이브러리:

```typescript
// ✅ 별도 타입 선언 파일 생성
declare module 'some-library' {
  export function someFunction(param: string): boolean;
}

// 또는 최소한의 타입 정의
interface SomeLibraryResponse {
  [key: string]: unknown;
}
```

### 7.2 Chrome API

브라우저 API의 경우:

## 8. 추가 지침 (Adapter/Pre-push/경계 설계)

### 8.1 Adapter(매핑) 계층 권장

- Core/외부의 느슨한 타입을 앱 레이어 DTO로 변환한 뒤 UI에 주입합니다.
- 예) IPC fetcher에서 `Preset`/`LlmBridgeConfig`를 `AppPreset`/`AppLlmBridgeConfig`로 매핑.

### 8.2 단언 최소화

- `as any`/이중 단언은 금지합니다. `unknown` + 타입가드, 구체 타입/제네릭으로 대체합니다.

### 8.3 Pre‑push 타입 안전성 체크

```bash
pnpm -r typecheck
pnpm -r lint -- --max-warnings=0
npx ts-prune # dead export 확인
```

### 8.4 컨테이너/프레젠테이션 경계의 타입

- 프레젠테이션: 동기 props만 소비(서버/IPC 접근 금지), DTO로 정규화된 타입만 사용
- 컨테이너: React Query + IPC fetchers로 비동기/뮤테이션 처리, invalidate 키 표준 유지
- 상태 도메인 불일치(예: UI draft vs core status)는 어댑터에서 명시적으로 매핑

```typescript
// ✅ 글로벌 타입 선언
declare global {
  const chrome: {
    runtime: {
      sendMessage: (
        message: ChromeExtensionMessage,
        callback: (response: ChromeExtensionResponse) => void
      ) => void;
    };
  };
}
```

## 8. 마이그레이션 완료 체크

다음 명령어로 any 타입 사용 여부 확인:

```bash
# any 타입 검색
grep -r ": any" src/renderer/
grep -r "any\[\]" src/renderer/
grep -r "Promise<any>" src/renderer/

# ESLint로 any 관련 에러 확인
npm run lint
```

## 결론

- **절대 `any` 사용 금지**
- **`unknown`, 제네릭, Union 타입 적극 활용**
- **타입 가드를 통한 안전한 타입 변환**
- **ESLint 규칙으로 자동 검증**
- **코드 리뷰에서 타입 안전성 확인**

이 지침을 따라 타입 안전한 코드를 작성하고, 런타임 오류를 예방하며, 코드의 가독성과 유지보수성을 향상시킵시다.

---

## 9. Electron/Preload & RPC 엄격 타이핑 지침 (강화)

- `as any` 금지: 이벤트/IPC 경계에서 `unknown` + 타입 가드/구체 타입을 사용합니다.
- 프레임 타입: `RpcFrame`(discriminated union: `req | res | err | nxt | end | can`)을 공용 타입으로 사용합니다.
- Preload는 테스트 가능한 팩토리로 분리합니다.
  - 예: `createElectronBridge(ipc: IpcLike)`, `createRpc(ipc: IpcLike)`
  - `IpcLike`는 `(event: unknown, payload: unknown)` 시그니처를 가진 `on/off`와 `send`만 포함합니다.
  - Electron 전역 의존 없이 순수 함수이므로 유닛 테스트 100% 커버리지가 가능합니다.
- 에러 타입: 서버 측 `CoreError` → 프레임 `err`로 매핑, 프리로드에서는 선택적으로 `toError(frame)` 훅으로 복원합니다.
- 전역 접근 금지: `window as any` 대신 전역 선언(`types.d.ts`)에 안전 API(`electronBridge`, `rpc`)를 명시합니다.

### 예시 (요지)

```ts
// factories (테스트 가능)
export interface IpcLike { on: (ch: string, l: (e: unknown, p: unknown) => void) => void; off: (...);
  send: (ch: string, payload: unknown) => void }
export function createElectronBridge(ipc: IpcLike) { /* start/post/on 구현 */ }
export function createRpc(ipc: IpcLike, opts?: { toError?: (f: RpcFrame) => Error }) { /* req→res/err */ }

// preload.ts
contextBridge.exposeInMainWorld('electronBridge', createElectronBridge(ipcRendererAdapter));
contextBridge.exposeInMainWorld('rpc', createRpc(ipcRendererAdapter));
```

## 10. 테스트 지침(Preload/RPC)

- 팩토리 기반으로 `MockIpc` 구현을 주입해 다음을 검증합니다.
  - `on()`의 구독/해제 동작과 핸들러 호출
  - `request()`의 `res` resolve / `err` reject / CID 불일치 프레임 무시
  - 응답 후 프레임 리스너 해제(메모리 누수 방지)
- 테스트에서 `any` 금지. 필요한 경우 `unknown`과 타입 가드를 사용합니다.

## 11. 린팅/정책 권고(점진 시행)

- 신규/변경 파일에 `@typescript-eslint/no-explicit-any: error` 적용(패키지별 점진 도입 권장).
- 테스트도 린트 대상에 포함하되, 과도한 차단을 피하기 위해 단계적 적용(폴더 단위 활성화).
- PR 체크리스트에 다음 항목 추가:
  - [ ] `as any`/이중 단언 없음
  - [ ] 경계(API/IPC/전역)에서 `unknown` + 가드 사용
  - [ ] 프레임/채널 이름이 공용 문서와 일치(IPC_TERMS_AND_CHANNELS.md)

## 12. 커밋/검토 원칙(타입 안전성)

- 커밋 단위는 기능/문서/테스트로 잘게 분리하여 회귀 지점을 명확히 합니다.
- 타입 제거/정밀화 커밋은 메시지 접두사로 표시: `types:`, `refactor(types):`, `test(types):`.
- 리뷰에서 `any`/`as any` 발견 시 변경 요청 필수. 예외는 외부 타입 선언 파일에 한정합니다.
