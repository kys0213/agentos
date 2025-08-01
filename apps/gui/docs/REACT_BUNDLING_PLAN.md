# React 번들링 설정 계획서

## Requirements

### 성공 조건

- [ ] React 앱이 단일 JS 파일로 번들링됨
- [ ] index.html에서 번들 파일 로드하여 GUI 정상 동작
- [ ] 개발 모드에서 hot reload 지원
- [ ] TypeScript, JSX 컴파일 정상 동작
- [ ] Chakra UI, electron-store 등 모든 의존성 정상 작동

### 사용 시나리오

- [ ] 개발자가 `pnpm dev` 실행시 Electron 앱에서 React UI 표시
- [ ] 코드 변경시 자동 리빌드 및 브라우저 새로고침
- [ ] 프로덕션 빌드시 최적화된 번들 생성

### 제약 조건

- [ ] 기존 TypeScript 설정과 호환
- [ ] electron-store, @agentos/core 등 기존 의존성 유지
- [ ] 개발/프로덕션 환경 모두 지원

## Interface Sketch

```typescript
// 번들러 옵션
interface BundlerConfig {
  entry: 'src/renderer/app/index.tsx';
  outfile: 'public/bundle.js';
  format: 'esm' | 'cjs';
  platform: 'browser' | 'neutral';
  external: string[];
}

// package.json scripts
{
  "build:renderer": "번들러로 React 앱 빌드",
  "dev": "concurrently \"tsc -w\" \"번들러 watch\" \"electron .\"",
  "watch:renderer": "번들러 watch 모드"
}
```

## Todo

- [x] 번들러 선택 및 설치 (Vite + React plugin 선택)
- [x] 번들러 설정 파일 작성 (vite.config.ts)
- [x] package.json scripts 업데이트 (build:renderer, watch:renderer)
- [x] index.html에서 번들 파일 로드 설정 (bundle.js 로드)
- [x] 개발 모드 watch 설정 (concurrently로 병렬 실행)
- [x] external 의존성 설정 (Node.js, Electron 모듈 external 처리)
- [x] TypeScript/JSX 변환 설정 (Vite가 자동 처리)
- [x] 테스트 실행 (pnpm dev로 React UI 확인)
- [x] 프로덕션 빌드 테스트 (성공적 번들링 확인)

## 작업 순서

1. **1단계**: 번들러 선택 및 기본 설정 (완료 조건: 단순 React 앱 번들링 성공)
2. **2단계**: external 설정 및 의존성 처리 (완료 조건: 모든 import 오류 해결)
3. **3단계**: 개발 환경 최적화 (완료 조건: watch 모드 및 hot reload 동작)
4. **4단계**: 검증 및 테스트 (완료 조건: 전체 기능 정상 동작)
