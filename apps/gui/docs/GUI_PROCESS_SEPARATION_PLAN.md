# GUI Main/Renderer 프로세스 분리 계획서

## Requirements

### 성공 조건

- [ ] Main 프로세스에서만 @agentos/core 패키지 사용
- [ ] Renderer 프로세스는 IPC 통신만 사용
- [ ] Main/Renderer 코드 디렉토리 분리
- [ ] 기존 기능 동일하게 유지
- [ ] 타입 안전성 확보

### 사용 시나리오

- [ ] 채팅 세션 생성/조회/로드 - IPC 통신으로
- [ ] MCP 클라이언트 관리 - IPC 통신으로
- [ ] 프리셋 관리 - IPC 통신으로
- [ ] 모든 core 기능이 main 프로세스에서만 실행

### 제약 조건

- [ ] Electron 보안 모델 준수
- [ ] 기존 저장된 데이터 호환성 유지
- [ ] 현재 UI 동작 변경 최소화

## Interface Sketch

```typescript
// 새로운 디렉토리 구조
src/
├── main/           // Main 프로세스 전용
│   ├── core-api.ts
│   ├── main.ts
│   └── services/
└── renderer/       // Renderer 프로세스 전용
    ├── components/
    ├── hooks/
    └── services/   // IPC 클라이언트만

// Renderer에서 IPC 클라이언트 사용
class ChatService {
  async createSession(options?: any) {
    return window.electronAPI.invoke('chat:create-session', options);
  }

  async listSessions() {
    return window.electronAPI.invoke('chat:list-sessions');
  }
}
```

## Todo

- [ ] 새로운 디렉토리 구조 생성 (src/main, src/renderer 분리)
- [ ] main 프로세스 코드 이동 및 정리
- [ ] renderer에서 core 패키지 직접 사용 제거
- [ ] IPC 클라이언트 서비스 레이어 구현
- [ ] preload.ts에 IPC API 노출
- [ ] 기존 컴포넌트들을 IPC 서비스로 연결
- [ ] 타입 정의 공유 구조 설정
- [ ] 테스트 실행으로 기능 검증
- [ ] TypeScript 컴파일 최종 확인

## 작업 순서

1. **1단계**: 디렉토리 구조 재설계 (완료 조건: main/renderer 분리)
2. **2단계**: main 프로세스 코드 이동 (완료 조건: core 로직 main에만 존재)
3. **3단계**: IPC 서비스 레이어 구현 (완료 조건: renderer가 IPC만 사용)
4. **4단계**: 검증 및 테스트 (완료 조건: 모든 기능 정상 동작)

## 예상 효과

- **보안 강화**: renderer에서 Node.js API 직접 접근 차단
- **아키텍처 명확화**: 책임 분리로 유지보수성 향상
- **타입 안전성**: IPC 통신 타입 정의로 런타임 오류 방지
- **확장성**: 향후 멀티 윈도우, 웹 버전 대응 용이
