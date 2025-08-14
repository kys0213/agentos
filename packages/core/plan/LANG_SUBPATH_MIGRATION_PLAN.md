# 작업계획서: packages/core 내 `@agentos/lang` 서브패스 임포트 전환

## Requirements

### 성공 조건

- [ ] `packages/core` 내 `@agentos/lang` 루트 임포트를 모두 서브패스(`@agentos/lang/<module>`)로 전환한다.
- [ ] 빌드/타입체크/테스트가 모두 통과한다(`pnpm -C packages/core build|typecheck|test`).
- [ ] 런타임 동작 동일성 보장: 변경 전/후 동등 기능(샘플 실행 또는 단위 테스트) 확인.
- [ ] 코드 스타일/가이드 준수: 불필요한 와일드카드 임포트 제거, 명시적 심볼 임포트 권장.
- [ ] 문서/주석의 사용 예시도 서브패스 기준으로 갱신한다(있다면).

### 사용 시나리오

- [ ] 파일 I/O 유틸 사용 시: `import { FileUtils } from '@agentos/lang/fs'`
- [ ] 날짜/시간 유틸 사용 시: `import { formatDate, ZonedDateTime } from '@agentos/lang/date'`
- [ ] 문자열/검증/데이터구조 유틸: `@agentos/lang/string`, `@agentos/lang/validation`, `@agentos/lang/datastructures`

### 제약 조건

- [ ] `@agentos/lang` 패키지 버전은 서브패스 `exports`가 반영된 버전이어야 함(모노레포 워크스페이스 내에서는 최신 변경사항 사용).
- [ ] CommonJS/ESM 모두에서 해상도가 가능해야 함(패키지 측 exports는 준비됨).
- [ ] 대규모 리팩터링 금지: 임포트 경로 변경에 한정하고, 관련 없는 리팩터링은 포함하지 않음.

## 현황 파악 결과(스코프)

리포지토리 검색 결과, 현재 `packages/core/src` 내에는 `@agentos/lang` 직접 임포트가 발견되지 않았습니다. (향후 추가/변경 시 적용을 위한 계획 수립 목적)

- 검색 기준: `from '@agentos/lang'`, `@agentos/lang/` 문자열
- 영향도: 현재 즉시 변경할 파일은 0건으로 판단됨. 다만, 문서/예제/주석 등에 사용 예시가 있다면 갱신 대상에 포함.

## Interface Sketch (변경 전/후 예시)

```ts
// 변경 전 (예시)
import { fs, date } from '@agentos/lang';
const ok = await fs.FileUtils.exists(path);
const s = date.formatDate(new Date());

// 변경 후
import { FileUtils } from '@agentos/lang/fs';
import { formatDate } from '@agentos/lang/date';
const ok = await FileUtils.exists(path);
const s = formatDate(new Date());
```

## Todo

- [ ] 코드 검색으로 실제 사용처 재검증(새로 추가된 코드 포함).
- [ ] 발견된 모든 루트 임포트를 서브패스로 전환.
- [ ] 타입/빌드 검증(`pnpm -C packages/core typecheck`, `pnpm -C packages/core build`).
- [ ] 단위 테스트 실행(`pnpm -C packages/core test`) 및 필요한 경우 스냅샷/테스트 보정.
- [ ] 문서/주석 내 사용 예시 경로 업데이트.
- [ ] 커밋: TODO 단위로 커밋(검색/변환/검증/문서 순).

## 작업 순서

1. 검색/스코프 확정: lang 사용처 식별 및 목록화(완료 조건: 변경 대상 파일 리스트 확정).
2. 코드 변환: 임포트 경로를 서브패스로 일괄 수정(완료 조건: 빌드/타입 에러 없음).
3. 검증: 테스트 실행 및 런타임 확인(완료 조건: 테스트 통과, 리그레션 없음).
4. 문서화: 예시/주석 경로 갱신 및 변경사항 요약(완료 조건: 리뷰 승인).
5. PR: 브랜치 푸시 및 PR 생성(완료 조건: CI 통과, 리뷰 요청).
