# Core Module Export Restructure Plan

## Requirements

### 성공 조건

- [ ] 브라우저 번들에서 Node 전용 의존성(fs, path 등)이 제외되고, GUI가 Core 스키마를 직접 import 하더라도 번들 에러가 발생하지 않는다.
- [ ] Core 패키지가 기능별 서브패스로 export 되며, 필요한 모듈만 명시적으로 가져올 수 있다.
- [ ] 기존 Node 환경 소비자(서비스 컨테이너, CLI 등)는 변경된 export 구조에서도 종전과 동일하게 동작한다.

### 사용 시나리오

- [ ] GUI가 `@agentos/core/schemas`(가칭)에서 Zod 스키마를 import 해도 브라우저 빌드가 성공한다.
- [ ] Node 기반 서비스가 `@agentos/core/node/preset-loader`처럼 Node 전용 API를 사용해도 런타임 동작에 변화가 없다.

### 제약 조건

- [ ] Core 내부에서 Node 내장 모듈을 사용하는 로직은 브라우저 안전 서브패스에 노출되지 않아야 한다.
- [ ] 패키지 구조 변경 후에도 TS 경로 별칭/입력 타입이 기존 소비자 코드와 호환되어야 한다.
- [ ] 배포 아티팩트(esm/cjs) 수는 기존 체계를 유지하되, 빌드 파이프라인 복잡도를 크게 증가시키지 않는다.

## Interface Sketch

```ts
// package.json (부분)
{
  "name": "@agentos/core",
  "exports": {
    ".": {
      "import": "./esm/index.js",
      "require": "./dist/index.cjs"
    },
    "./schemas": {
      "import": "./esm/browser/schemas.js",
      "types": "./esm/browser/schemas.d.ts"
    },
    "./preset": {
      "import": "./esm/browser/preset.js"
    },
    "./node/preset-loader": {
      "import": "./esm/node/preset-loader.js",
      "require": "./dist/node/preset-loader.cjs"
    }
  }
}

// 브라우저 안전 서브패스 예시
export * from '../shared/schemas';

// Node 전용 모듈은 내부에서만 dynamic import 사용
export async function loadPresetFromFile(path: string) {
  const { readFile } = await import('node:fs/promises');
  // ...
}
```

## Todo

- [ ] Core 내부 의존성 지도 작성 (어떤 모듈이 Node 내장을 사용하는지 식별)
- [ ] 서브패스 별 진입점 설계 (`schemas`, `preset`, `mcp`, `node/*` 등)
- [ ] package.json `exports`/`typesVersions` 업데이트 및 번들 엔트리 정리
- [ ] Node 전용 모듈에서 dynamic import 또는 lazy load 적용 검토
- [ ] GUI & Node 소비자 빌드/테스트 실행으로 회귀 확인
- [ ] 문서 업데이트 (패키지 사용 가이드, 마이그레이션 노트)

## 작업 순서

1. **의존성 맵 작성**: Node 내장 모듈 사용 지점을 정리하고 브라우저 안전 모듈 후보를 분류한다. (완료 조건: 스프레드시트/문서로 공유)
2. **서브패스 설계 & 시그니처 정리**: 각 서브패스가 노출할 API 목록을 정의하고 index 재구성. (완료 조건: 설계 문안 + 리뷰 승인)
3. **exports 재구성 & lazy 로딩 적용**: package.json 업데이트, 필요 시 dynamic import 적용, ESM/CJS 빌드 확인. (완료 조건: `pnpm build` 성공, lint/test 통과)
4. **소비자 검증 & 문서화**: GUI 빌드, Node 시나리오 테스트, 변경사항 요약 문서화. (완료 조건: 회귀 테스트 통과 + docs 갱신)
