# @agentos/lang

`@agentos/lang`는 AgentOS 전반에서 공용으로 사용하는 언어/유틸리티 레이어입니다.

- **Date 유틸리티**: 포맷/파싱/연산 + 타임존 지원
- **자료구조**: 고성능 `LinkedList`, `Queue`, `Deque`
- **문자열 유틸리티**: 케이스 변환, 슬러그, 표시 폭/정규식 이스케이프

## 설치

워크스페이스 루트에서 의존성 설치를 실행하면 됩니다.

```bash
pnpm install
```

개별 패키지 의존성은 다음과 같습니다.

```bash
pnpm add -w date-fns date-fns-tz mnemonist change-case slugify escape-string-regexp @innei/string-width
```

## 사용 예시

```ts
import { date, ds, str } from '@agentos/lang';

// Date
const iso = '2025-08-09T06:45:00Z';
const pretty = date.formatDate(iso, 'yyyy-MM-dd HH:mm', 'Asia/Seoul');
const zoned = date.toZoned(iso, 'Asia/Seoul');

// Data structures
const list = new ds.LinkedList<number>();
list.push(1);
list.push(2);

const q = new ds.Queue<number>();
q.enqueue(10);
q.enqueue(11);

const d = new ds.Deque<string>();
d.pushFront('a');

// String
const slug = str.slugify('Hello, World!', { lower: true, strict: true });
const width = str.stringWidth('한글A');
```

## 라이브러리 선택 배경

### Date: `date-fns` + `date-fns-tz`

- 모듈성/트리 셰이킹: 필요한 함수만 임포트 → 번들 최소화
- TypeScript 우선: 모든 API에 타입 정의 제공
- 현대적 API: 포맷/파싱/연산의 일관된 함수형 스타일
- 타임존 지원: `formatInTimeZone`, `zonedTimeToUtc` 등 제공

### 자료구조: `mnemonist`

- 고성능 구현: 덱/큐/연결리스트 연산 최적화
- 구조 다양성: `LinkedList`, `Deque`, `Queue` 등 제공
- TS 타입 지원: 제네릭 기반 타입 정의 포함
- 현실적 선택: 네이티브 의존성 없이 서버/데스크톱(Electron) 모두 적합

> 덱(Deque)은 큐/스택을 일반화한 구조로, 앞/뒤 O(1) 연산이 가능해 메시지 버퍼·작업 스케줄러 등에 유용합니다.

### 문자열: `change-case` + `slugify` + `escape-string-regexp` + `@innei/string-width`

- change-case: `camelCase`, `PascalCase`, `param-case`, `snake_case` 등 표준 케이스 변환
- slugify: 로캘/옵션 기반 슬러그 생성(`{ lower: true, strict: true }` 권장)
- escape-string-regexp: 사용자 입력을 안전하게 정규식으로 활용
- @innei/string-width: 이모지/한중일 문자 폭 계산으로 콘솔/표 렌더 정렬 보장(CJS/ESM 듀얼)

## 내보내기(Exports)

- `date`: 포맷/파싱/타임존 헬퍼와 자주 쓰는 `date-fns` 함수 재노출
- `ds`: `LinkedList`, `Queue`, `Deque` 및 타입 별칭 `LinkedQueue`, `LinkedDeque`
- `str`: `change-case` 계열, `slugify`, `escapeStringRegexp`, `stringWidth`

## 설계 노트

- 외부 라이브러리를 얇게 래핑/재노출하여 교체 가능성을 확보했습니다.
- GUI/CLI/코어 어디서든 동일한 API로 접근 가능한 최소 의존성 표면을 유지합니다.
- 필요 시 도메인별 헬퍼를 `date/`, `datastructures/`, `string/` 하위에 추가하세요.

## ZonedDateTime 사용 예시

```ts
import { date } from '@agentos/lang';
const { ZonedDateTime, Format } = date;

const seoulNow = ZonedDateTime.now('Asia/Seoul');
const input = ZonedDateTime.valueOf('2025-08-09T06:45:00Z', 'Asia/Seoul');

seoulNow.isBefore(input);
seoulNow.isBetween(input, seoulNow);

seoulNow.add().minutes(15);
seoulNow.add().days(1);
seoulNow.minus().hours(2);

seoulNow.format({ preset: Format.YMDHH24MISS });
seoulNow.toISO();
seoulNow.toISO({ format: 'basic' });
```

### TimeZone 타입

- `TimeZone`: 공통 리터럴 유니온(`'UTC' | 'Asia/Seoul' | ...'`) + 유효성 검증된 브랜디드 문자열
- `COMMON_TIME_ZONES`: 자주 쓰는 IANA 식별자 집합
- `asTimeZone(zoneId: string)`: 유효성 검사 후 `TimeZone`로 변환

```ts
import { date } from '@agentos/lang';
const { ZonedDateTime, asTimeZone, COMMON_TIME_ZONES } = date;

const tz = asTimeZone('Asia/Seoul');
const now = ZonedDateTime.now(tz);
const utcNow = ZonedDateTime.now('UTC'); // 공통 리터럴은 자동 타입 추론
```
