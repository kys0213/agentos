# 작업계획서: core 패키지 트리 쉐이킹 구조 개선

## Requirements

### 성공 조건

- [ ] 소비자가 `@agentos/core/agent` 같이 서브패스를 import하면 해당 모듈과 직간접 의존성만 번들에 포함된다.
- [ ] `pnpm build` 후 부분 import 번들 크기가 감소한다.
- [ ] Node/브라우저 환경에서 기존 API와 호환성이 유지된다.

### 사용 시나리오

- [ ] 프론트엔드 앱에서 `@agentos/core/agent`만 사용하여 빌드 시 불필요한 chat, memory 코드가 제외된다.
- [ ] 백엔드 서비스가 `@agentos/core/llm`만 import해도 다른 모듈이 번들에 포함되지 않는다.

### 제약 조건

- [ ] ESM/CJS 듀얼 빌드 구조 유지.
- [ ] `sideEffects`는 `false`로 유지하되, 사이드 이펙트가 필요한 파일은 명시적으로 관리.
- [ ] 공개 API 경로와 시그니처는 가능한 변경하지 않는다.

## Interface Sketch

```typescript
// packages/core/src/index.ts
export * from './agent';
export * from './chat';
export * from './llm';
export * from './memory';
export * from './preset';
export * from './tool';
export * from './common';
export * from './knowledge';
```

## Todo

- [x] 각 서브모듈( agent, chat, common, knowledge, llm, memory, preset, tool )에 `index.ts` 추가하여 내부 파일을 재export
- [x] `packages/core/src/index.ts`를 서브모듈 단위 `export * from` 방식으로 정리
- [x] `packages/core/package.json`에 서브패스 exports(`./agent`, `./chat` 등) 정의
- [x] `@agentos/lang` import를 필요한 서브패스(`@agentos/lang/fs` 등)로 교체
- [x] 테스트 및 빌드 스크립트 실행으로 리팩터링 검증
- [x] 관련 문서/주석 업데이트 시 필요한 부분 수정

## 작업 순서

1. **1단계**: plan 파일 작성 및 커밋 (완료 조건: 본 문서 커밋)
2. **2단계**: 각 서브모듈 `index.ts` 작성 및 루트 index.ts 수정 (완료 조건: 빌드 성공)
3. **3단계**: package.json exports 수정 및 lang 서브패스 import 교체 (완료 조건: 테스트 통과)
4. **4단계**: 문서/주석 정리 후 최종 커밋 (완료 조건: 모든 Todo 체크)
