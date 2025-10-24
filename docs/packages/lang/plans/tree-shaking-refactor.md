# 작업계획서: lang 패키지 트리 쉐이킹 구조 개선

## Requirements

### 성공 조건

- [ ] 소비자가 `@agentos/lang/string`과 같이 서브패스를 import하면 필요한 유틸만 번들에 포함된다.
- [ ] 루트 `@agentos/lang`에서 특정 함수만 import해도 사용되지 않는 다른 코드가 번들에 포함되지 않는다.
- [ ] `pnpm build` 후 부분 import 시 번들 크기가 감소한다.

### 사용 시나리오

- [ ] 프론트엔드 앱이 `import { slugify } from '@agentos/lang/string'`만 사용할 때 다른 유틸이 제거된다.
- [ ] 백엔드 서비스가 `@agentos/lang/fs` 유틸만 사용해도 나머지 모듈이 번들에 포함되지 않는다.

### 제약 조건

- [ ] ESM/CJS 듀얼 빌드 구조 유지.
- [ ] `sideEffects`는 `false` 유지.
- [ ] 기존 API 경로와 시그니처는 변경하지 않는다.

## Interface Sketch

```typescript
// packages/lang/src/index.ts
export * from './date';
export * from './datastructures';
export * from './fs';
export * from './json';
export * from './string';
export * from './utils';
export * from './validation';
```

## Todo

- [x] 루트 `index.ts`를 서브모듈 단위 `export * from` 방식으로 수정
- [x] 각 서브모듈의 독립적인 `index.ts` 구조 검토 및 보존
- [x] 필요 시 `package.json` `exports` 정리 및 누락된 서브패스 추가 여부 확인
- [x] `pnpm build` 및 `pnpm test`로 구조 검증

## 작업 순서

1. **1단계**: plan 파일 작성 및 커밋
2. **2단계**: 루트 `index.ts` 수정
3. **3단계**: `exports` 설정 검토 및 빌드/테스트 실행
