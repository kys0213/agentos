# 작업계획서: @agentos/lang 서브패스(exports) 도입

## Requirements

### 성공 조건

- [ ] `@agentos/lang/date`, `@agentos/lang/fs` 등 서브패스 임포트를 공식 지원한다.
- [ ] ESM/CSR(Require) 양쪽에서 동작하도록 `package.json`의 `exports`에 `import`/`require`를 모두 매핑한다.
- [ ] 타입 해상도: 각 서브패스별 `.d.ts`가 정확히 매핑되며 TS 5.2+ 환경에서 문제없이 동작한다.
- [ ] 현재 `@agentos/lang` 루트 임포트(재-export)는 역호환을 위해 유지하되, 문서로 서브패스 사용을 권장한다.
- [ ] 빌드 산출물 구조가 `dist/<submodule>/index.js(.d.ts)` 형태로 일관되게 생성된다.
- [ ] 단위 테스트(또는 간이 사용 검증)가 서브패스 임포트 동작을 확인한다.

### 사용 시나리오

- [ ] 사용자 A: 번들 크기 최적화를 위해 `import { DateTime } from '@agentos/lang/date'`로 필요한 모듈만 임포트한다.
- [ ] 사용자 B: 파일 유틸만 필요해 `import * as fs from '@agentos/lang/fs'`를 사용한다.
- [ ] 기존 사용자: `import { date, fs } from '@agentos/lang'` 코드는 계속 동작하지만, 릴리스 노트/문서에서 서브패스 사용을 권장한다.

### 제약 조건

- [ ] Node/TS 해상도 규칙 상 `package.json`의 `exports`가 단일 진입점만 노출하므로, 서브패스 경로별 항목을 모두 명시해야 한다.
- [ ] TS < 5.2 환경 호환을 강제하지 않는다. 필요 시 후속으로 `typesVersions`를 추가 검토한다.
- [ ] CJS 지원 유지가 필요하면 `dist/*.cjs` 산출물을 계속 생산해야 한다.

## Interface Sketch

```json
{
  "name": "@agentos/lang",
  "type": "module",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    },
    "./date": {
      "types": "./dist/date/index.d.ts",
      "import": "./dist/date/index.js",
      "require": "./dist/date/index.cjs"
    },
    "./fs": {
      "types": "./dist/fs/index.d.ts",
      "import": "./dist/fs/index.js",
      "require": "./dist/fs/index.cjs"
    },
    "./json": {
      "types": "./dist/json/index.d.ts",
      "import": "./dist/json/index.js",
      "require": "./dist/json/index.cjs"
    },
    "./string": {
      "types": "./dist/string/index.d.ts",
      "import": "./dist/string/index.js",
      "require": "./dist/string/index.cjs"
    },
    "./utils": {
      "types": "./dist/utils/index.d.ts",
      "import": "./dist/utils/index.js",
      "require": "./dist/utils/index.cjs"
    },
    "./validation": {
      "types": "./dist/validation/index.d.ts",
      "import": "./dist/validation/index.js",
      "require": "./dist/validation/index.cjs"
    },
    "./datastructures": {
      "types": "./dist/datastructures/index.d.ts",
      "import": "./dist/datastructures/index.js",
      "require": "./dist/datastructures/index.cjs"
    },
    "./package.json": "./package.json"
  }
}
```

## Todo

- [ ] `packages/lang/package.json`에 서브패스 `exports` 추가 (`date`, `fs`, `json`, `string`, `utils`, `validation`, `datastructures`).
- [ ] 빌드 출력 구조 점검 및 필요 시 `tsconfig`/빌드 스크립트 보정(Esm/Cjs, d.ts 동시 산출 확인).
- [ ] 간이 테스트: 각 서브패스에서 대표 심볼 임포트 후 타입/런타임 확인.
- [ ] 문서 업데이트: 사용 예시(`@agentos/lang/date`)와 마이그레이션 가이드 추가.
- [ ] 릴리스 노트: 루트 재-export는 유지되나 서브패스 사용 권장 안내.

## 작업 순서

1. 계획서 확정: 요구사항/범위 확인(완료 조건: 본 문서 승인).
2. `exports` 구현: `package.json` 수정 및 빌드 구조 검증(완료 조건: 빌드 통과, d.ts 매핑 확인).
3. 검증/테스트: 서브패스 임포트로 샘플 사용 테스트 추가(완료 조건: 테스트 통과).
4. 문서화: 사용 예시/마이그레이션 가이드 작성(완료 조건: 리뷰 승인).
5. 단계적 전환: 차기 릴리스에 공지, 이후 루트 재-export 축소 여부 검토.
