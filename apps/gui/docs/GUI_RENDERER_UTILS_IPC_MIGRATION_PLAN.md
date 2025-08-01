# GUI Renderer Utils IPC 마이그레이션 계획서

## Requirements

### 성공 조건

- [ ] **추상화 완성**: 모든 서비스가 추상 인터페이스로 정의되고 구현체와 분리됨
- [ ] **플랫폼 독립성**: UI 컴포넌트들이 브라우저와 Electron 환경 모두에서 실행 가능
- [ ] **Adapter 패턴 구현**: 환경별로 다른 구현체가 자동으로 주입되는 팩토리 시스템 완성
- [ ] **IPC 마이그레이션**: `renderer/utils/` 디렉토리의 모든 기능이 추상화된 서비스를 통해 접근
- [ ] **Main 프로세스 집중화**: `BridgeManager`, 파일 시스템 접근, MCP 관리가 main 프로세스에서 처리
- [ ] **호환성 유지**: 기존 컴포넌트 인터페이스가 변경 없이 작동
- [ ] **확장성 확보**: 새로운 환경(PWA, Tauri 등) 지원을 위한 확장 포인트 제공
- [ ] **테스트 완성**: Mock 서비스를 포함한 모든 환경별 테스트 통과

### 사용 시나리오

- **Electron 환경 개발자**: BridgeManager를 통해 LLM Bridge를 등록하고 전환할 때, main 프로세스에서 안전하게 관리됨
- **브라우저 환경 개발자**: 동일한 UI 컴포넌트와 인터페이스를 사용하여 웹 애플리케이션으로 배포 가능
- **사용자 (Electron)**: 채팅 세션 생성/로드 시 파일 시스템 접근이 main 프로세스에서 처리되어 보안 강화
- **사용자 (브라우저)**: 동일한 UI 경험으로 웹에서 채팅 기능 사용, 서버 API를 통한 데이터 처리
- **테스트 개발자**: Mock 서비스를 주입하여 UI 로직과 비즈니스 로직을 독립적으로 테스트
- **시스템**: 환경에 관계없이 일관된 인터페이스로 서비스 접근, 확장 시 새로운 구현체만 추가

### 제약 조건

- **플랫폼 독립성**: UI 컴포넌트들이 브라우저 환경에서도 실행 가능해야 함
- **추상화 필수**: IPC 연결 부분을 adapter 패턴으로 추상화하여 교체 가능한 구조 구현
- Electron의 보안 모델 준수 (renderer에서 직접 파일 시스템 접근 금지)
- 기존 컴포넌트 인터페이스 최대한 유지
- 성능 저하 최소화 (IPC 호출 최적화)

## 현재 상태 분석

### 1. renderer/utils/ 현재 구조

**BridgeManager.ts**

- LLM Bridge 등록/관리
- 메모리 기반 상태 관리
- → **변경 필요**: main 프로세스로 이동

**chat-manager.ts**

- FileBasedChatManager 직접 사용
- 파일 시스템 직접 접근 (`.agent/sessions`)
- → **변경 필요**: IPC 통신으로 전환

**mcp-loader.ts**

- TODO 주석 존재: "MCP를 IPC 서비스로 변환"
- 설정만 로드, 실제 인스턴스는 Main 프로세스 필요
- → **변경 필요**: 완전한 IPC 구현

### 2. main/services/ 기존 IPC 핸들러

**기존 구현됨:**

- `chat-ipc-handlers.ts`: 채팅 세션 기본 CRUD
- `mcp-ipc-handlers.ts`: MCP 클라이언트 기본 관리
- `preset-ipc-handlers.ts`: 프리셋 기본 관리

**추가 필요:**

- Bridge 관리 IPC 핸들러
- 고급 채팅 기능 (메시지 전송, 스트리밍 등)
- MCP 고급 기능 (도구 실행, 리소스 접근 등)

### 3. renderer/services/ IPC 클라이언트

**현재 구현됨:**

- `chat-service.ts`: 기본 채팅 IPC 클라이언트
- `mcp-service.ts`: 기본 MCP IPC 클라이언트
- `preset-service.ts`: 기본 프리셋 IPC 클라이언트

**확장 필요:**

- Bridge 관리 클라이언트 추가
- 고급 기능들 추가

## Interface Sketch

### 단일 통신 계층 추상화 (IpcChannel)

```typescript
// 모든 환경별 통신을 추상화하는 단일 인터페이스
export interface IpcChannel {
  // Chat 관련 메서드들
  createChatSession(options?: { preset?: any }): Promise<ChatSession>;
  listChatSessions(): Promise<ChatSession[]>;
  loadChatSession(sessionId: string): Promise<ChatSession>;
  sendChatMessage(sessionId: string, message: string): Promise<SendMessageResponse>;
  streamChatMessage(sessionId: string, message: string): Promise<ReadableStream>;

  // Bridge 관련 메서드들
  registerBridge(id: string, config: LlmBridgeConfig): Promise<{ success: boolean }>;
  switchBridge(id: string): Promise<{ success: boolean }>;
  getCurrentBridge(): Promise<{ id: string; config: LlmBridgeConfig }>;
  getBridgeIds(): Promise<string[]>;

  // MCP 관련 메서드들
  getAllMcp(): Promise<McpConfig[]>;
  connectMcp(config: McpConfig): Promise<{ success: boolean }>;
  executeMcpTool(clientName: string, toolName: string, args: any): Promise<ToolExecutionResponse>;

  // Preset 관련 메서드들
  getAllPresets(): Promise<Preset[]>;
  createPreset(preset: Preset): Promise<{ success: boolean }>;
  updatePreset(preset: Preset): Promise<{ success: boolean }>;
  deletePreset(id: string): Promise<{ success: boolean }>;
}
```

### 환경별 IpcChannel 구현체

```typescript
// Electron 환경: window.electronAPI 사용
export class ElectronIpcChannel implements IpcChannel {
  async createChatSession(options?: { preset?: any }) {
    return window.electronAPI.chat.createSession(options);
  }

  async registerBridge(id: string, config: LlmBridgeConfig) {
    return window.electronAPI.bridge.register(id, config);
  }

  async getAllMcp() {
    return window.electronAPI.mcp.getAll();
  }

  // ... 모든 메서드를 electronAPI로 위임
}

// 브라우저 환경: HTTP API 사용
export class WebIpcChannel implements IpcChannel {
  private baseUrl = '/api';

  async createChatSession(options?: { preset?: any }) {
    const response = await fetch(`${this.baseUrl}/chat/sessions`, {
      method: 'POST',
      body: JSON.stringify(options),
    });
    return response.json();
  }

  async registerBridge(id: string, config: LlmBridgeConfig) {
    const response = await fetch(`${this.baseUrl}/bridge/register`, {
      method: 'POST',
      body: JSON.stringify({ id, config }),
    });
    return response.json();
  }

  // ... 모든 메서드를 HTTP API로 위임
}

// Chrome Extension 환경: chrome.runtime 사용
export class ChromeExtensionIpcChannel implements IpcChannel {
  async createChatSession(options?: { preset?: any }) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: 'createChatSession', payload: options }, resolve);
    });
  }

  // ... 모든 메서드를 chrome.runtime으로 위임
}

// 테스트 환경: Mock 데이터 사용
export class MockIpcChannel implements IpcChannel {
  private mockSessions: ChatSession[] = [];
  private mockBridges: Map<string, LlmBridgeConfig> = new Map();

  async createChatSession(options?: { preset?: any }) {
    const session = { id: Math.random().toString(), ...options };
    this.mockSessions.push(session);
    return session;
  }

  // ... 모든 메서드를 메모리 기반으로 구현
}
```

### 환경별 IpcChannel 팩토리

```typescript
export class IpcChannelFactory {
  static create(): IpcChannel {
    // Electron 환경 감지
    if (typeof window !== 'undefined' && window.electronAPI) {
      return new ElectronIpcChannel();
    }

    // Chrome Extension 환경 감지
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      return new ChromeExtensionIpcChannel();
    }

    // 테스트 환경 감지
    if (process.env.NODE_ENV === 'test') {
      return new MockIpcChannel();
    }

    // 기본값: 브라우저 환경
    return new WebIpcChannel();
  }
}
```

### 서비스 클래스들 (환경 독립적)

```typescript
// ChatService는 환경에 관계없이 하나만 존재
export class ChatService {
  constructor(private ipcChannel: IpcChannel) {}

  async createSession(options?: { preset?: any }) {
    return this.ipcChannel.createChatSession(options);
  }

  async listSessions() {
    return this.ipcChannel.listChatSessions();
  }

  async loadSession(sessionId: string) {
    return this.ipcChannel.loadChatSession(sessionId);
  }

  async sendMessage(sessionId: string, message: string) {
    return this.ipcChannel.sendChatMessage(sessionId, message);
  }
}

export class BridgeService {
  constructor(private ipcChannel: IpcChannel) {}

  async register(id: string, config: LlmBridgeConfig) {
    return this.ipcChannel.registerBridge(id, config);
  }

  async switchBridge(id: string) {
    return this.ipcChannel.switchBridge(id);
  }

  async getCurrentBridge() {
    return this.ipcChannel.getCurrentBridge();
  }

  async getBridgeIds() {
    return this.ipcChannel.getBridgeIds();
  }
}
```

### Bootstrap 및 DI 시스템

```typescript
// 애플리케이션 Bootstrap
export function bootstrap(ipcChannel: IpcChannel) {
  // 모든 서비스에 동일한 IpcChannel 주입
  const chatService = new ChatService(ipcChannel);
  const bridgeService = new BridgeService(ipcChannel);
  const mcpService = new McpService(ipcChannel);
  const presetService = new PresetService(ipcChannel);

  // 서비스들을 전역적으로 사용 가능하게 설정
  ServiceContainer.register('chat', chatService);
  ServiceContainer.register('bridge', bridgeService);
  ServiceContainer.register('mcp', mcpService);
  ServiceContainer.register('preset', presetService);

  return {
    chatService,
    bridgeService,
    mcpService,
    presetService,
  };
}

// 환경별 진입점
// Electron: src/renderer/main-electron.ts
const ipcChannel = new ElectronIpcChannel();
bootstrap(ipcChannel);

// Web: src/renderer/main-web.ts
const ipcChannel = new WebIpcChannel();
bootstrap(ipcChannel);

// Chrome Extension: src/renderer/main-extension.ts
const ipcChannel = new ChromeExtensionIpcChannel();
bootstrap(ipcChannel);
```

### 컴포넌트에서의 사용

```typescript
// UI 컴포넌트는 ServiceContainer에서 서비스 가져오기
export function ChatComponent() {
  const chatService = ServiceContainer.get<ChatService>('chat');

  const handleSendMessage = async (message: string) => {
    // 환경에 관계없이 동일한 인터페이스
    await chatService.sendMessage(currentSessionId, message);
  };

  // ... 컴포넌트 로직
}
```

## Todo

- [ ] **1단계: IpcChannel 인터페이스 정의**
  - [ ] `renderer/services/ipc/IpcChannel.ts` 생성 (단일 통신 추상화 인터페이스)
  - [ ] 모든 도메인(Chat, Bridge, MCP, Preset) 메서드 포함
  - [ ] TypeScript 타입 정의 완성

- [ ] **2단계: Bridge IPC 핸들러 구현**
  - [ ] `main/services/bridge-ipc-handlers.ts` 생성
  - [ ] BridgeManager main 프로세스 구현
  - [ ] IPC 핸들러 등록 (chat, bridge, mcp, preset 통합)

- [ ] **3단계: Main 프로세스 IPC 확장**
  - [ ] `chat-ipc-handlers.ts`에 메시지 전송/스트리밍 추가
  - [ ] `mcp-ipc-handlers.ts`에 도구 실행/리소스 접근 추가
  - [ ] 모든 핸들러를 IpcChannel 인터페이스와 일치하도록 확장

- [ ] **4단계: Electron IpcChannel 구현체**
  - [ ] `renderer/services/ipc/ElectronIpcChannel.ts` 생성
  - [ ] window.electronAPI를 사용한 모든 메서드 구현
  - [ ] shared/types/electron-api.ts 타입 확장

- [ ] **5단계: 환경별 IpcChannel 구현체 (기본 구조)**
  - [ ] `renderer/services/ipc/WebIpcChannel.ts` 생성 (HTTP API 기반)
  - [ ] `renderer/services/ipc/ChromeExtensionIpcChannel.ts` 생성 (chrome.runtime 기반)
  - [ ] `renderer/services/ipc/MockIpcChannel.ts` 생성 (테스트용)

- [ ] **6단계: IpcChannel 팩토리 및 환경 감지**
  - [ ] `renderer/services/ipc/IpcChannelFactory.ts` 생성
  - [ ] 환경 자동 감지 로직 구현 (Electron, Chrome Extension, Web, Test)
  - [ ] 환경별 적절한 IpcChannel 구현체 반환

- [ ] **7단계: 서비스 클래스 리팩토링 (DI 기반)**
  - [ ] 기존 `ChatService`, `BridgeService`, `McpService`, `PresetService` 수정
  - [ ] 생성자에서 IpcChannel 의존성 주입 받도록 변경
  - [ ] 각 서비스는 환경 독립적으로 하나의 구현체만 유지

- [ ] **8단계: Bootstrap 시스템 구축**
  - [ ] `renderer/bootstrap.ts` 생성 (애플리케이션 초기화)
  - [ ] `ServiceContainer` 구현 (서비스 등록/조회 시스템)
  - [ ] 환경별 진입점 파일들 생성 (main-electron.ts, main-web.ts 등)

- [ ] **9단계: Utils 마이그레이션**
  - [ ] `renderer/utils/BridgeManager.ts` → ServiceContainer.get('bridge') 사용
  - [ ] `renderer/utils/chat-manager.ts` → ServiceContainer.get('chat') 사용
  - [ ] `renderer/utils/mcp-loader.ts` → ServiceContainer.get('mcp') 사용
  - [ ] 기존 직접 구현 제거, 서비스 위임으로 변경

- [ ] **10단계: 컴포넌트 업데이트**
  - [ ] 모든 컴포넌트를 ServiceContainer 기반으로 변경
  - [ ] 직접적인 IPC 호출 제거
  - [ ] 환경에 무관한 서비스 인터페이스 사용

- [ ] **11단계: 테스트 업데이트**
  - [ ] MockIpcChannel을 사용한 테스트 환경 구축
  - [ ] 기존 테스트들을 새로운 아키텍처에 맞게 수정
  - [ ] 환경별 통합 테스트 추가 (Electron, Web)

- [ ] **12단계: 정리 및 문서화**
  - [ ] 사용하지 않는 코드/의존성 제거
  - [ ] IpcChannel 아키텍처 문서 작성
  - [ ] 새로운 환경 추가 가이드 작성 (PWA, Tauri 등)
  - [ ] 개발자 온보딩 문서 업데이트

## 작업 순서

1. **1단계**: IpcChannel 인터페이스 정의 (완료 조건: 단일 통신 추상화 인터페이스 완성)
2. **2-3단계**: Main 프로세스 IPC 핸들러 확장 (완료 조건: 모든 기능이 main에서 IPC로 제공)
3. **4단계**: Electron IpcChannel 구현체 (완료 조건: window.electronAPI 기반 완전한 구현체)
4. **5-6단계**: 환경별 구현체 및 팩토리 (완료 조건: Web, Extension, Mock 구현체 + 자동 환경 감지)
5. **7-8단계**: DI 시스템 및 Bootstrap (완료 조건: 서비스 의존성 주입 시스템 완성)
6. **9-10단계**: Utils 및 컴포넌트 마이그레이션 (완료 조건: 모든 코드가 IpcChannel 기반으로 전환)
7. **11-12단계**: 테스트 및 문서화 (완료 조건: 환경별 테스트 통과, 확장 가이드 완성)

## 복잡도 판단 근거

이 작업은 **분할정복** 접근이 필요한 고도로 복잡한 작업입니다:

✅ **분할정복 적용 기준 (6개 해당)**

- **20개 이상의 파일 수정/생성 필요**: utils, services, handlers, types, abstracts, electron, web, factory 등
- **새로운 아키텍처 패턴 도입**: Adapter 패턴, Dependency Injection, Factory 패턴
- **플랫폼 독립성 구현**: Electron과 Browser 환경 모두 지원
- **3개 이상의 모듈에 영향**: main, renderer, shared + 새로운 abstracts, electron, web 모듈
- **복잡한 비즈니스 로직**: 환경 감지, 동적 서비스 주입, 인터페이스 추상화
- **예상 작업 시간 8시간 이상**: 설계 + 구현 + 테스트 + 문서화

**추가 복잡성 요인:**

- **단일 추상화의 복잡성**: 모든 도메인 기능을 하나의 IpcChannel에 통합하는 설계 복잡도
- **환경별 구현체 일관성**: Electron, Web, Extension 등 환경별로 동일한 인터페이스 보장
- **의존성 주입 시스템**: Bootstrap과 ServiceContainer를 통한 체계적인 DI 구현
- **향후 확장성 고려**: PWA, Tauri 등 새로운 환경 추가 시 IpcChannel 구현체만 추가하면 되는 구조

따라서 12단계의 세밀한 계획으로 분할하여 체계적으로 진행하며, **IpcChannel이라는 단일 추상화 포인트**를 중심으로 안전하고 확장 가능한 아키텍처로 마이그레이션을 수행합니다.
