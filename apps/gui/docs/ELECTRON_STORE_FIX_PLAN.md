# Electron Store 타입 호환성 개선 계획서

## Requirements

### 성공 조건
- [ ] TypeScript 컴파일 오류 완전 해결 (any 타입 사용 없이)
- [ ] ESLint 경고 제거
- [ ] 기존 store 기능 동일하게 유지
- [ ] 타입 안전성 확보

### 사용 시나리오
- [ ] LlmBridgeStore: Bridge 설정 저장/조회/삭제
- [ ] McpConfigStore: MCP 설정 저장/조회
- [ ] PresetStore: 프리셋 저장/조회/삭제
- [ ] 모든 store가 electron-store API와 완전 호환

### 제약 조건
- [ ] 기존 저장된 데이터 호환성 유지
- [ ] 현재 store 인터페이스 변경 최소화
- [ ] electron-store 최신 버전 활용

## Interface Sketch

```typescript
// Option 1: 의존성 다운그레이드
"electron-store": "^8.x.x"  // 이전 안정 버전

// Option 2: 최신 버전 호환 구현
import Store from 'electron-store';

type StoreSchema = {
  bridges: LlmBridgeConfig[];
};

export class LlmBridgeStore {
  private store: Store<StoreSchema>;
  
  constructor(options?: Store.Options<StoreSchema>) {
    this.store = new Store<StoreSchema>({...});
  }
  
  // 적절한 타입으로 메서드 구현
  list(): LlmBridgeConfig[] {
    return this.store.get('bridges', []);
  }
}
```

## Todo

- [x] 현재 electron-store 버전 및 호환성 확인
- [ ] 의존성 다운그레이드 시도 (Option 1) - 생략 (8.2.0 버전 사용)
- [x] 다운그레이드 불가능시 최신 버전 호환 구현 (Option 2)
- [x] LlmBridgeStore 타입 수정
- [x] McpConfigStore 타입 수정  
- [x] PresetStore 타입 수정
- [x] 테스트 실행으로 기능 검증
- [x] TypeScript 컴파일 최종 확인 (electron-store 관련 오류 해결)

## 추가 발견된 문제들 (core-api.ts)

### 새로운 타입 오류들
- [ ] `FileBasedChatManager` 생성자 인수 개수 불일치 (line 27)
- [ ] `McpRegistry.getConnectedClients()` 메서드 존재하지 않음 (line 93)
- [ ] `McpRegistry.connect()` 메서드 존재하지 않음 (line 104)  
- [ ] `PresetRepository.save()` 메서드 존재하지 않음 (line 127)

### 해결 방안
1. **@agentos/core 패키지 인터페이스 확인**
   - 실제 구현된 메서드명과 시그니처 파악
   - 생성자 매개변수 요구사항 확인

2. **core-api.ts 수정**
   - 올바른 메서드명으로 변경
   - 생성자 호출 방식 수정
   - 타입 안전성 확보

## 추가 Todo (core-api.ts 타입 오류 해결)

- [x] @agentos/core 패키지의 실제 인터페이스 조사
- [x] FileBasedChatManager 생성자 매개변수 수정
- [x] McpRegistry 올바른 메서드명 확인 및 수정
- [x] PresetRepository 올바른 메서드명 확인 및 수정
- [x] 최종 TypeScript 컴파일 검증

## 작업 순서

### 1단계 (완료): Electron Store 타입 호환성
- ✅ 현재 상황 분석 (완료 조건: 버전 호환성 파악)
- ✅ 해결 방안 선택 및 적용 (완료 조건: electron-store 타입 오류 해결)
- ✅ 검증 및 테스트 (완료 조건: store 기능 정상 동작)

### 2단계 (완료): Core API 타입 오류 해결
- ✅ **2-1단계**: @agentos/core 인터페이스 분석 (완료 조건: 실제 API 파악)
- ✅ **2-2단계**: core-api.ts 타입 오류 수정 (완료 조건: 모든 타입 오류 해결)
- ✅ **2-3단계**: 전체 시스템 검증 (완료 조건: TypeScript 컴파일 성공)

## 🎉 작업 완료 요약

### ✅ 해결된 문제들
1. **Electron Store 타입 호환성**: ElectronStore.Options<T> 타입 사용으로 해결
2. **FileBasedChatManager**: CompressStrategy 매개변수 추가하여 3개 인수로 수정
3. **McpRegistry**: getConnectedClients() → getAll(), connect() → register()로 수정
4. **PresetRepository**: save() → create()로 수정

### ✅ 최종 결과
- **TypeScript 컴파일 오류 0개** (모든 타입 오류 해결)
- **타입 안전성 확보** (any 타입 사용 없이)
- **@agentos/core 인터페이스 준수** (GUI가 core에 맞춤)

## 3단계 (신규): Main/Renderer 프로세스 분리

### 발견된 아키텍처 문제
- **중복 구현**: renderer와 main 둘 다 ChatManager 직접 생성
- **보안 위반**: renderer에서 직접 @agentos/core 접근
- **패키지 구조 혼재**: main/renderer 코드가 섞여있음

### 새로운 요구사항
- [ ] Main 프로세스에서만 @agentos/core 패키지 사용
- [ ] Renderer 프로세스는 IPC 통신만 사용
- [ ] src/main, src/renderer 디렉토리 분리
- [ ] 기존 기능 동일하게 유지
- [ ] Electron 보안 모델 준수

### 새로운 디렉토리 구조
```
src/
├── main/           // Main 프로세스 전용
│   ├── main.ts
│   ├── core-api.ts
│   └── services/
├── renderer/       // Renderer 프로세스 전용
│   ├── app/
│   ├── components/
│   ├── hooks/
│   ├── stores/
│   └── services/   // IPC 클라이언트만
└── shared/         // 공통 타입 정의
    └── types/
```

### 추가 Todo (프로세스 분리)
- [ ] 새로운 디렉토리 구조 생성
- [ ] main 프로세스 코드 정리 및 이동
- [ ] renderer에서 core 패키지 직접 사용 제거
- [ ] IPC 클라이언트 서비스 레이어 구현
- [ ] preload.ts에 타입 안전한 IPC API 노출
- [ ] 기존 컴포넌트들을 IPC 서비스로 연결
- [ ] 공통 타입 정의 분리
- [ ] 전체 시스템 검증

### 3단계 작업 순서
- ✅ **3-1단계**: 디렉토리 구조 재설계 (완료 조건: main/renderer 분리)
- ✅ **3-2단계**: main 프로세스 코드 정리 (완료 조건: core 로직 main에만 존재)
- 🔄 **3-3단계**: IPC 서비스 레이어 구현 (진행중: renderer의 @agentos/core 의존성 제거)
- ⏳ **3-4단계**: 검증 및 테스트 (완료 조건: 모든 기능 정상 동작)

### 🔄 현재 진행상황 (3-3단계)

**완료된 작업:**
- ✅ src/main, src/renderer 디렉토리 분리
- ✅ main 프로세스 파일들 이동 (main.ts, core-api.ts, preload.ts)
- ✅ IPC 클라이언트 서비스 구현 (ChatService, McpService, PresetService)
- ✅ 타입 안전한 preload.ts API 구조
- ✅ 공통 타입 정의 (shared/types/)

**진행중인 작업:**
- 🔄 renderer에서 @agentos/core 직접 사용 제거
- 🔄 기존 컴포넌트들을 IPC 서비스로 연결

**남은 작업:**
- renderer의 모든 @agentos/core import 제거
- hooks/components의 IPC 서비스 연동
- 타입 호환성 완전 해결

### ✨ 추가 개선사항 (IPC 핸들러 관심사 분리)

**현재 문제점:**
- core-api.ts에 모든 IPC 핸들러가 응집됨 (God Object)
- 장기적으로 유지보수 어려움
- 관심사가 섞여있음

**개선 방안:**
```
src/main/services/
├── chat-ipc-handlers.ts     // 채팅 관련 IPC 핸들러
├── mcp-ipc-handlers.ts      // MCP 관련 IPC 핸들러  
├── preset-ipc-handlers.ts   // 프리셋 관련 IPC 핸들러
└── index.ts                 // 통합 등록 함수
```

**기대 효과:**
- 관심사 분리 (SRP 원칙)
- 유지보수성 향상
- 코드 가독성 개선
- 테스트 용이성

### 추가 Todo (IPC 핸들러 분리)
- [x] main/services 디렉토리 구조 생성
- [x] 각 도메인별 IPC 핸들러 파일 분리
- [x] 통합 등록 함수 구현
- [x] core-api.ts 리팩토링

### ✅ IPC 핸들러 분리 완료

**새로운 구조:**
```
src/main/services/
├── chat-ipc-handlers.ts     // 채팅 관련 IPC 핸들러 (50라인 → 독립)
├── mcp-ipc-handlers.ts      // MCP 관련 IPC 핸들러 (30라인 → 독립)  
├── preset-ipc-handlers.ts   // 프리셋 관련 IPC 핸들러 (40라인 → 독립)
└── index.ts                 // 통합 등록 함수 (20라인)
```

**개선 효과:**
- ✅ core-api.ts 150라인 → **8라인** (95% 감소!)
- ✅ 관심사별 완전 분리 (SRP 준수)
- ✅ 개별 테스트 가능
- ✅ 유지보수성 대폭 향상

### ✨ 추가 개선 완료: 의존성 생성 관심사 분리

**기존 문제점:**
- core-api.ts가 모든 의존성 팩토리 역할까지 담당
- 각 도메인별 의존성이 한 곳에 응집됨

**개선 결과:**
```
src/main/services/
├── chat-ipc-handlers.ts     ✅ 채팅 + ChatManager 생성
├── mcp-ipc-handlers.ts      ✅ MCP + McpRegistry 생성
├── preset-ipc-handlers.ts   ✅ 프리셋 + PresetRepository 생성
└── index.ts                 ✅ 통합 호출만
```

**최종 구조:**
- **core-api.ts**: 단 8라인 (단순 위임만)
- **각 도메인**: 완전 독립 (의존성 생성 + IPC 핸들링)
- **완벽한 캡슐화**: 각 도메인이 자신의 라이프사이클 완전 관리

## 4단계 (신규): Renderer @agentos/core 완전 제거

### 🎯 목표: 완전한 IPC 기반 아키텍처 구축

**현재 문제 분석:**
```
renderer에서 @agentos/core 직접 사용하는 파일들:
├── hooks/useChatSession.ts          ❌ ChatManager, ChatSession 직접 사용
├── components/ChatSidebar.tsx       ❌ ChatSessionDescription
├── components/PresetSelector.tsx    ❌ Preset 타입
├── pages/McpSettings.tsx           ❌ McpConfig 타입  
├── pages/McpList.tsx              ❌ Mcp 타입
├── pages/PresetManager.tsx        ❌ Preset 타입
└── utils/mcp-loader.ts            ❌ McpConfig 직접 조작
```

### 📋 완전 리팩토링 계획

#### **Phase 1: Hook 리팩토링 (핵심)**
- [ ] useChatSession → IPC 기반 재작성
- [ ] ChatManager 의존성 → ChatService 사용
- [ ] ChatSession 객체 조작 → IPC 메시지 기반

#### **Phase 2: 컴포넌트 타입 정리** 
- [ ] ChatSidebar: ChatSessionDescription → renderer 타입
- [ ] PresetSelector: Preset → renderer 타입
- [ ] McpSettings: McpConfig → renderer 타입
- [ ] McpList: Mcp → renderer 타입
- [ ] PresetManager: Preset → renderer 타입

#### **Phase 3: 유틸리티 함수 IPC 변환**
- [ ] mcp-loader.ts → IPC 서비스 사용
- [ ] chat-manager.ts → 완전 제거 (deprecated)

#### **Phase 4: 타입 시스템 정리**
- [ ] renderer/types/core-types.ts → 실제 필요한 필드만
- [ ] shared/types/electron-api.ts → 정확한 IPC 계약
- [ ] @agentos/core import 완전 제거

### 🔧 리팩토링 상세 계획

#### **1. useChatSession Hook 재설계**
```typescript
// 기존: @agentos/core 의존
interface UseChatSession {
  session: ChatSession | null;          ❌
  openSession(id: string): Promise<ChatSession>; ❌
}

// 새로운: IPC 기반
interface UseChatSession {
  sessionId: string | null;              ✅
  messages: Message[];                   ✅
  openSession(id: string): Promise<void>; ✅
  sendMessage(text: string): Promise<void>; ✅
}
```

#### **2. 컴포넌트 데이터 흐름 변경**
```typescript
// 기존: 직접 객체 조작
const session = await chatManager.create();
await session.appendMessage(message);

// 새로운: IPC 서비스 사용  
const sessionId = await chatService.createSession();
await chatService.sendMessage(sessionId, message);
```

#### **3. 타입 정의 최적화**
```typescript
// renderer/types/core-types.ts (최소한으로)
interface ChatSessionDescription {
  id: string;
  title?: string;
  createdAt: string;  // Date → string (직렬화 고려)
}

interface Preset {
  id: string;
  name: string;
  description: string;
  // core 전용 필드들 제거
}
```

### ⚡ 예상 효과
- **완전한 프로세스 분리**: renderer가 core 로직에 직접 접근 불가
- **보안 강화**: Electron 샌드박스 모델 완전 준수  
- **타입 안전성**: IPC 계약 기반 명확한 타입 정의
- **유지보수성**: renderer와 main의 독립적 개발 가능
- **테스트 용이성**: IPC 모킹으로 renderer 단위 테스트

### 📅 작업 순서
1. **useChatSession 리팩토링** (가장 중요)
2. **컴포넌트별 순차 수정** (의존성 낮은 것부터)
3. **유틸리티 함수 정리**
4. **최종 타입 검증 및 정리**