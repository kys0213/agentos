# 다크 모드 마이그레이션 계획서

Status: In Progress
Last Updated: 2025-09-16

## 📋 현황 분석

### 1. Design 디렉토리 (새로운 시스템)

- **테마 시스템**: CSS 변수 기반의 현대적 다크 모드 구현
- **UI 라이브러리**: shadcn/ui (Radix UI + Tailwind CSS)
- **테마 전환**: `useTheme` 훅을 통한 light/dark/system 모드 지원
- **스타일 시스템**: OKLCH 색상 체계, CSS Custom Properties 활용
- **구현 완성도**: 완전한 다크 모드 지원 (모든 컴포넌트 대응)

### 2. Renderer 디렉토리 (기존 시스템)

- **테마 시스템**: Chakra UI의 `useColorMode` 사용
- **UI 라이브러리**: Chakra UI + shadcn/ui 혼재
- **테마 전환**: `ColorModeToggle` 컴포넌트 (Chakra UI 기반)
- **스타일 시스템**: 부분적인 CSS 변수 사용, 다크 모드 미완성
- **구현 완성도**: 제한적 다크 모드 (일부 변수만 정의)

## 🔄 주요 변경사항

### 1. 테마 시스템 교체

```diff
- Chakra UI의 useColorMode
+ CSS 변수 + useTheme 훅 (design 패턴)
```

### 2. 색상 체계 통합

```diff
- 부분적 CSS 변수 정의
+ 완전한 OKLCH 색상 체계 (light/dark 모두 정의)
+ 상태 색상 (active, idle, inactive, error, success, warning)
+ 차트 색상, 사이드바 색상 등 전체 토큰화
```

### 3. 컴포넌트 다크 모드 대응

```diff
- 일부 컴포넌트만 다크 모드 지원
+ 모든 UI 컴포넌트 다크 모드 완벽 지원
```

### 4. 테마 저장 및 시스템 연동

```diff
- Chakra UI 기본 저장 방식
+ localStorage 기반 + 시스템 테마 감지
```

## 📐 마이그레이션 전략

### Phase 1: 기반 시스템 구축 (우선순위: 높음)

1. **globals.css 통합**
   - design의 완전한 CSS 변수 시스템 이식
   - 기존 부분적 변수를 완전한 시스템으로 교체
2. **useTheme 훅 이식**
   - Chakra UI 의존성 제거
   - 새로운 테마 시스템으로 전환

3. **테마 전환 UI 구현**
   - ColorModeToggle을 새 시스템으로 재구현
   - light/dark/system 3가지 모드 지원

### Phase 2: 컴포넌트 마이그레이션 (우선순위: 중간)

1. **UI 컴포넌트 다크 모드 대응**
   - shadcn/ui 컴포넌트들의 다크 모드 스타일 확인
   - Chakra UI 컴포넌트의 점진적 교체

2. **레이아웃 컴포넌트 업데이트**
   - Sidebar, AppLayout 등 주요 레이아웃 다크 모드 대응
   - 배경색, 테두리색 등 CSS 변수 적용

### Phase 3: 세부 조정 및 최적화 (우선순위: 낮음)

1. **색상 일관성 검증**
   - 모든 컴포넌트의 다크 모드 색상 검토
   - WCAG 접근성 기준 충족 확인

2. **성능 최적화**
   - 테마 전환 시 리렌더링 최적화
   - CSS 변수 사용 최적화

## 📝 TODO 리스트

### 🔴 긴급 (Phase 1 - 1주차)

1. **[ ] globals.css 완전 교체**
   - design/src/styles/globals.css의 전체 변수 시스템 이식
   - 기존 부분적 정의 제거 및 통합
   - 파일 경로: `src/renderer/styles/globals.css`

2. **[ ] useTheme 훅 구현**
   - design/src/hooks/useTheme.ts 이식
   - Chakra UI 의존성 제거
   - 파일 경로: `src/renderer/hooks/useTheme.ts`

3. **[ ] ColorModeToggle 재구현**
   - Chakra UI 버전을 shadcn/ui 버전으로 교체
   - DropdownMenu로 light/dark/system 선택 UI
   - 파일 경로: `src/renderer/components/common/ColorModeToggle.tsx`

4. **[ ] theme.ts 제거 및 정리**
   - Chakra UI theme 설정 파일 제거
   - 관련 import 정리

5. **[ ] IPC 통신 구현**
   - Main 프로세스에 테마 설정 핸들러 추가
   - electron-store 통합 (영구 저장)
   - 파일 경로: `src/main/handlers/theme.handler.ts`

6. **[ ] App Store 테마 상태 추가**
   - UIState에 theme 필드 추가
   - setTheme 액션 구현
   - IPC 통신 연동
   - 파일 경로: `src/renderer/stores/app-store.ts`

### 🟡 중요 (Phase 2 - 2주차)

7. **[ ] Layout 컴포넌트 다크 모드**
   - ManagementView 다크 모드 대응
   - Sidebar 컴포넌트 CSS 변수 적용
   - ChatViewContainer 다크 모드 확인

8. **[ ] 주요 컴포넌트 스타일 업데이트**
   - Dashboard
   - ModelManager
   - PresetManager
   - SubAgentManager

9. **[ ] Chakra UI 컴포넌트 교체 계획 수립**
   - 사용 중인 Chakra 컴포넌트 목록 작성
   - shadcn/ui 대체 컴포넌트 매핑

10. **[ ] RPC 계약 확장 검토**
    - app.contract.ts 생성 필요성 평가
    - 테마 설정 인터페이스 설계
    - 코드 생성 스크립트 업데이트

### 🟢 보통 (Phase 3 - 3주차)

11. **[ ] 색상 일관성 검증**
    - 모든 화면에서 다크 모드 테스트
    - 색상 대비 접근성 검증
    - 누락된 다크 모드 스타일 보완

12. **[ ] 문서화 및 가이드 작성**
    - 다크 모드 구현 가이드
    - 새로운 컴포넌트 추가 시 다크 모드 체크리스트

13. **[ ] 테스트 작성**
    - useTheme 훅 테스트
    - 테마 전환 E2E 테스트
    - IPC 통신 테스트
    - 스토어 동기화 테스트

## 🔌 테마 저장소 전략 (localStorage 활용)

### 1. 단순화된 저장 방식

- **브라우저 localStorage**: 테마 설정 영구 저장
- **React State**: 런타임 상태 관리
- **IPC 통신 불필요**: Main 프로세스 수정 없음

### 2. 구현 방식

```typescript
// useTheme 훅에서 localStorage 직접 활용
const useTheme = () => {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(() => {
    // localStorage에서 초기값 로드
    return (localStorage.getItem('theme') as any) || 'system';
  });

  const updateTheme = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    // DOM에 테마 클래스 적용
    applyThemeToDOM(newTheme);
  };

  return { theme, updateTheme };
};
```

### 3. 장점

- 구조 단순화 (IPC 통신 불필요)
- 기존 RPC 아키텍처에 영향 없음
- Main 프로세스 수정 불필요
- 즉각적인 테마 적용 가능

## 🔄 React Query 호환성

### 1. 테마 상태 관리

- **현재**: Zustand 스토어 (app-store.ts) 사용
- **추가 필요**: 테마 상태를 스토어에 추가
- **React Query**: 설정 변경 시 캐시 무효화 불필요 (UI 상태)

### 2. 컴포넌트 리렌더링 최적화

```typescript
// useTheme 훅과 React Query 병행 사용 시
const { theme } = useTheme();
const { data } = usePresets(); // React Query
// 테마 변경이 쿼리 재실행을 트리거하지 않도록 주의
```

## 🏪 스토어 마이그레이션 전략

### 1. App Store 확장

```typescript
interface AppState {
  ui: UIState & {
    theme: 'light' | 'dark' | 'system';
    systemTheme?: 'light' | 'dark';
  };
  // ... 기존 상태
}
```

### 2. 테마 액션 추가

```typescript
interface AppActions {
  // ... 기존 액션
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setSystemTheme: (theme: 'light' | 'dark') => void;
}

// localStorage와 연동
const setTheme = (theme) => {
  localStorage.setItem('theme', theme);
  set((state) => ({ ui: { ...state.ui, theme } }));
};
```

### 3. 브라우저 간 동기화

- storage 이벤트를 통한 탭/창 간 자동 동기화
- localStorage 변경 감지 및 상태 업데이트

## ⚠️ 위험 요소 및 대응 방안

### 1. Chakra UI와 shadcn/ui 충돌

- **위험**: 두 시스템의 스타일 충돌 가능성
- **대응**: 단계적 마이그레이션, 컴포넌트별 격리

### 2. 기존 기능 손상

- **위험**: 테마 시스템 변경으로 인한 기능 영향
- **대응**: 철저한 테스트, 점진적 롤아웃

### 3. 성능 저하

- **위험**: CSS 변수 과다 사용으로 인한 성능 문제
- **대응**: 필요한 변수만 선별 사용, 성능 모니터링

### 4. 사용자 경험 일관성

- **위험**: 마이그레이션 중 일관성 없는 UI
- **대응**: Phase별 완전 마이그레이션, 중간 상태 최소화

### 5. 브라우저 간 동기화 문제

- **위험**: 여러 탭/창에서 테마 상태 불일치
- **대응**: storage 이벤트 리스너로 실시간 동기화

### 6. localStorage 접근 제한

- **위험**: 프라이빗 모드 등에서 localStorage 사용 불가
- **대응**: 메모리 기반 폴백, 기본 테마로 동작

## 📊 성공 지표

1. **기능적 완성도**
   - [ ] 모든 페이지에서 다크 모드 정상 작동
   - [ ] 테마 전환 시 즉각적인 반영
   - [ ] 시스템 테마 자동 감지 작동
   - [ ] 앱 재시작 후에도 테마 설정 유지 (localStorage)

2. **기술적 품질**
   - [ ] Chakra UI 의존성 완전 제거
   - [ ] 모든 컴포넌트 CSS 변수 기반 스타일링
   - [ ] 테마 전환 시 깜빡임 없음
   - [ ] 여러 탭/창 간 테마 상태 동기화

3. **사용자 경험**
   - [ ] WCAG AA 기준 색상 대비 충족
   - [ ] 테마 설정 영구 저장 (localStorage)
   - [ ] 부드러운 테마 전환 애니메이션
   - [ ] 모든 탭/창에서 테마 일관성 유지

4. **아키텍처 품질**
   - [ ] 기존 RPC 아키텍처에 영향 없음
   - [ ] React Query와 충돌 없는 상태 관리
   - [ ] Zustand 스토어와 localStorage 통합
   - [ ] 에러 처리 및 폴백 메커니즘 구현

## 🔗 참고 자료

- Design 시스템: `/apps/gui/design/src/styles/globals.css`
- Theme Hook: `/apps/gui/design/src/hooks/useTheme.ts`
- UI 컴포넌트: `/apps/gui/design/src/components/ui/`
- 현재 구현: `/apps/gui/src/renderer/`

---

**마이그레이션 시작일**: 2025-01-09
**예상 완료일**: 2025-01-30 (3주)
**담당자**: Frontend Architect Agent

---

## 🔧 Phase 4: Mock 서비스 구현 (추가)

다크 모드 테스트 중 발견된 서비스 연결 문제를 해결하기 위해 웹 개발 모드에서 사용할 Mock 서비스를 구현합니다.

### 문제점

- `pnpm dev:web` 실행 시 RPC 연결 불가
- ServiceContainer에서 서비스를 찾을 수 없음 (agent, preset 등)
- 개발 및 테스트 환경에서 UI 개발이 어려움

### 구현 계획

#### 1. Mock 서비스 인터페이스 생성

```typescript
// src/renderer/services/mocks/index.ts
export * from './mock-agent-service';
export * from './mock-preset-service';
export * from './mock-chat-service';
export * from './mock-model-service';
```

#### 2. Bootstrap 수정

```typescript
// src/renderer/bootstrap.ts
export async function bootstrapMockServices() {
  // Mock 서비스들을 ServiceContainer에 등록
  ServiceContainer.register('agent', new MockAgentService());
  ServiceContainer.register('preset', new MockPresetService());
  ServiceContainer.register('chat', new MockChatService());
  ServiceContainer.register('model', new MockModelService());
}
```

#### 3. RPC Channel Factory 수정

```typescript
// src/renderer/rpc/rpc-channel.factory.ts
export function createRpcTransport() {
  if (process.env.NODE_ENV === 'development' && !window.electronAPI) {
    // Mock transport for web development
    return new MockRpcTransport();
  }
  // ... 기존 로직
}
```

### TODO 리스트 (Phase 4)

#### 🔴 긴급

1. **[ ] Mock RPC Transport 구현**
   - MockRpcTransport 클래스 생성
   - 기본 RPC 메서드 스텁 구현

2. **[ ] Mock Agent Service 구현**
   - 샘플 에이전트 데이터
   - CRUD 작업 시뮬레이션

3. **[ ] Mock Preset Service 구현**
   - 샘플 프리셋 데이터
   - 프리셋 관리 기능

#### 🟡 중요

4. **[ ] Mock Chat Service 구현**
   - 채팅 세션 관리
   - 메시지 히스토리

5. **[ ] Mock Model Service 구현**
   - 샘플 모델 리스트
   - 모델 설정 기능

6. **[ ] Bootstrap 로직 수정**
   - 환경별 서비스 초기화
   - Mock 서비스 자동 등록

#### 🟢 보통

7. **[ ] Mock 데이터 관리**
   - localStorage 기반 영속성
   - 초기 데이터 시드

8. **[ ] 개발 가이드 작성**
   - Mock 서비스 사용법
   - 새 Mock 서비스 추가 방법

### 예상 효과

- `pnpm dev:web`으로 전체 UI 개발 가능
- RPC/Electron 없이도 프론트엔드 개발 및 테스트
- 다크 모드 포함 모든 UI 기능 검증 가능
- 빠른 개발 사이클

### 위험 요소

- Mock과 실제 서비스 간 인터페이스 불일치
- Mock 데이터 관리의 복잡성
- 실제 환경과의 동작 차이

---

**Phase 4 시작일**: TBD
**예상 소요 시간**: 1주
