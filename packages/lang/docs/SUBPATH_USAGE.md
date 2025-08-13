# @agentos/lang 서브패스 임포트 가이드

`@agentos/lang`는 모듈별 서브패스 임포트를 지원합니다. 필요 모듈만 가져와 API 표면을 명확히 하고 번들 크기를 줄일 수 있습니다.

## 사용 예시

```ts
// Date 유틸만 사용
import { formatDate, ZonedDateTime } from '@agentos/lang/date';

// 파일 유틸만 사용
import { FileUtils } from '@agentos/lang/fs';

// 문자열, 검증 유틸 등
import * as str from '@agentos/lang/string';
import * as validation from '@agentos/lang/validation';
```

지원 서브패스
- `@agentos/lang/date`
- `@agentos/lang/fs`
- `@agentos/lang/json`
- `@agentos/lang/string`
- `@agentos/lang/utils`
- `@agentos/lang/validation`
- `@agentos/lang/datastructures`

## 마이그레이션 노트

기존에는 루트에서 재-export 형태로 사용했습니다.

```ts
// 이전(계속 동작함)
import { date, fs } from '@agentos/lang';
const s = date.formatDate(new Date());
```

이제는 다음과 같이 서브패스를 권장합니다.

```ts
// 권장
import { formatDate } from '@agentos/lang/date';
```

루트 임포트는 당분간 역호환을 위해 유지되지만, 신규 코드에서는 서브패스 사용을 권장합니다.

## Node 환경 참고사항

- CommonJS (`require`) 환경: 자동으로 `dist/*`(CJS) 산출물을 사용합니다.
- ES Module (`import`) 환경: `esm/*` 산출물을 사용합니다. Node에서 직접 실행 시, ESM의 상대 import 확장자 요구로 인해 일부 환경에서 경고가 보일 수 있습니다. 일반적으로 번들러/TS 트랜스파일러(예: Vite, Webpack, ts-node) 환경에서 정상 동작합니다.

## 간이 동작 확인

패키지 내부 검증 스크립트

```bash
# CJS 검증
pnpm -C packages/lang run verify:cjs

# (선택) ESM 검증 – 번들러가 아닌 순수 Node 실행에서는 경고/제한이 있을 수 있습니다.
pnpm -C packages/lang run verify:esm
```
