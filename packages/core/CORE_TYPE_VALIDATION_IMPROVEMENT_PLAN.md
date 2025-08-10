# Core 타입 검증 로직 개선 계획서

## 📋 개요

packages/lang에 추가된 타입 검증 유틸리티를 활용하여 packages/core의 타입 검증 로직을 개선하는 계획입니다.

## 🔍 현재 상황 분석

### 기존 타입 검증 패턴
1. **수동 타입 체크**: `typeof`, `instanceof`, `Array.isArray` 직접 사용
2. **에러 처리**: `error instanceof Error ? error.message : 'Unknown error'` 패턴
3. **배열 길이 체크**: `array.length > 0` 직접 체크
4. **JSON 파싱**: `JSON.parse()` 직접 사용 (안전하지 않음)
5. **null/undefined 체크**: 개별적인 조건문 사용

### 식별된 개선 대상 영역

#### 🔴 High Priority (높은 우선순위)

1. **MCP Tool 관련** (`/tool/mcp/`)
   - **mcp.ts**: 168라인 `typeof result.content === 'string'` 패턴
   - **mcp.ts**: 179라인 `error instanceof Error` 체크
   - **mcp-usage-tracker.ts**: 배열 길이 체크 및 통계 계산 로직
   - **개선 혜택**: MCP 도구의 안정성 및 에러 처리 향상

2. **Agent 관리** (`/agent/`)
   - **simple-agent-manager.ts**: 99라인 `error instanceof Error` 체크
   - **simple-agent.ts**: 배열 길이 체크 (`enabledMcps.length === 0`)
   - **개선 혜택**: Agent 실행 중 타입 안전성 보장

3. **Chat Session 파일 처리** (`/chat/file/`)
   - **file-based-chat-session-check-point-file.ts**: 34라인 `JSON.parse()` 직접 사용
   - **개선 혜택**: 파일 파싱 중 에러 방지 및 데이터 무결성 보장

#### 🟡 Medium Priority (중간 우선순위)

4. **Knowledge 처리** (`/knowledge/`)
   - **tokenizer.ts**: 배열 길이 체크 (`tokens.length > 0`)
   - **bm25-index.ts**: 배열 조작 및 길이 체크 로직
   - **markdown-splitter.ts**: 다양한 배열 및 문자열 길이 체크
   - **개선 혜택**: 텍스트 처리 안정성 향상

5. **공통 유틸리티** (`/common/`)
   - **parseJson.ts**: 이미 @agentos/lang 사용 중이나 deprecated
   - **개선 혜택**: 최신 타입 검증 API로 업데이트

## 🎯 개선 목표

### 1. 타입 안전성 향상
- 런타임 타입 에러 최소화
- 더 구체적인 타입 가드 사용

### 2. 코드 품질 개선
- 일관된 타입 검증 패턴 적용
- 중복 코드 제거

### 3. 에러 처리 강화
- 안전한 JSON 파싱
- 더 나은 에러 메시지 제공

### 4. 유지보수성 향상
- lang 패키지의 검증 함수 재사용
- 표준화된 검증 로직

## 📝 상세 개선 계획

### Phase 1: MCP Tool 검증 로직 개선 (High Priority)

**파일**: `src/tool/mcp/mcp.ts`

**개선 대상**:
```typescript
// Before (Line 168)
error = typeof result.content === 'string' ? result.content : String(result.content);

// After  
import { isString } from '@agentos/lang/validation';
error = isString(result.content) ? result.content : String(result.content);

// Before (Line 179)
error = e instanceof Error ? e.message : String(e);

// After
import { isError } from '@agentos/lang/validation';
error = isError(e) ? e.message : String(e);
```

**예상 효과**:
- 더 명확한 타입 검증
- 일관된 에러 처리 패턴

### Phase 2: Agent 관리 로직 개선 (High Priority)

**파일**: `src/agent/simple-agent-manager.ts`, `src/agent/simple-agent.ts`

**개선 대상**:
```typescript
// Before
if (!enabledMcps || enabledMcps.length === 0) {

// After
import { isNonEmptyArray } from '@agentos/lang/validation';
if (!isNonEmptyArray(enabledMcps)) {

// Before  
error instanceof Error ? error.message : 'Unknown error'

// After
import { isError } from '@agentos/lang/validation';
isError(error) ? error.message : 'Unknown error'
```

### Phase 3: 파일 기반 세션 처리 개선 (High Priority)

**파일**: `src/chat/file/file-based-chat-session-check-point-file.ts`

**개선 대상**:
```typescript
// Before (Line 34)
return JSON.parse(content);

// After
import { json } from '@agentos/lang';
return json.safeJsonParse(content, null);
```

**추가 개선**:
- 타입 검증을 통한 Checkpoint 구조 확인
- 파싱 실패 시 더 나은 에러 처리

### Phase 4: Knowledge 처리 로직 개선 (Medium Priority)

**파일**: `src/knowledge/tokenizer.ts`, `src/knowledge/bm25/bm25-index.ts`

**개선 대상**:
```typescript
// Before
if (tokens.length > 0) return tokens;

// After  
import { isNonEmptyArray } from '@agentos/lang/validation';
if (isNonEmptyArray(tokens)) return tokens;
```

### Phase 5: 공통 유틸리티 업데이트 (Medium Priority)

**파일**: `src/common/utils/parseJson.ts`

**개선 대상**:
```typescript
// Before (deprecated)
export const parseJson = json.parseJson;

// After
import { isString, isPlainObject } from '@agentos/lang/validation';
export const parseJsonSafely = <T = unknown>(text: unknown): T | null => {
  if (!isString(text)) return null;
  
  const result = json.safeJsonParse(text);
  return isPlainObject(result) ? result as T : null;
};
```

## ✅ TODO 리스트

### Phase 1: MCP Tool 검증 로직 개선
- [ ] mcp.ts의 타입 체크를 lang 유틸리티로 교체
- [ ] mcp-usage-tracker.ts의 배열 처리 로직 개선
- [ ] 단위 테스트 업데이트 및 추가

### Phase 2: Agent 관리 로직 개선  
- [ ] simple-agent-manager.ts의 에러 처리 개선
- [ ] simple-agent.ts의 배열 검증 로직 교체
- [ ] Agent 관련 테스트 케이스 보강

### Phase 3: 파일 기반 세션 처리 개선
- [ ] JSON 파싱을 safeJsonParse로 교체
- [ ] Checkpoint 타입 검증 로직 추가
- [ ] 파일 처리 에러 케이스 테스트 추가

### Phase 4: Knowledge 처리 로직 개선
- [ ] tokenizer.ts 배열 검증 개선
- [ ] bm25-index.ts 타입 안전성 강화
- [ ] markdown-splitter.ts 문자열/배열 처리 개선

### Phase 5: 공통 유틸리티 업데이트
- [ ] parseJson.ts deprecated 함수 교체
- [ ] 새로운 타입 안전 파싱 함수 구현
- [ ] 하위 호환성 확인 및 마이그레이션 가이드 작성

## 🚀 작업 우선순위

1. **즉시 시작**: Phase 1 (MCP Tool) - 가장 많은 타입 검증 로직 포함
2. **주 단위**: Phase 2 (Agent 관리) - 핵심 비즈니스 로직
3. **격주 단위**: Phase 3 (파일 처리) - 데이터 무결성 중요
4. **월 단위**: Phase 4-5 (Knowledge, 유틸리티) - 점진적 개선

## 📊 성공 지표

### 정량적 지표
- [ ] 타입 관련 런타임 에러 50% 감소
- [ ] `typeof`, `instanceof` 직접 사용 90% 감소  
- [ ] JSON.parse 직접 사용 100% 제거
- [ ] 코드 중복도 30% 감소

### 정성적 지표
- [ ] 일관된 타입 검증 패턴 적용
- [ ] 더 명확한 에러 메시지 제공
- [ ] 유지보수성 향상
- [ ] 코드 리뷰 시간 단축

## 🔧 기술 요구사항

### Dependencies
- `@agentos/lang` 패키지의 validation 모듈
- 기존 테스트 프레임워크 호환성 유지

### 테스트 전략
- 각 Phase별 단위 테스트 추가/수정
- 타입 검증 실패 케이스 테스트 강화
- 통합 테스트에서 타입 안전성 검증

### 성능 고려사항
- lang 패키지 import 오버헤드 최소화
- 런타임 타입 체크 성능 영향 모니터링
- 필요시 타입 체크 캐싱 전략 적용

## 🎯 성공 조건

1. **모든 Phase 완료**: 계획된 모든 개선사항 구현
2. **테스트 통과**: 기존 기능 동작 보장 + 새로운 테스트 케이스 통과
3. **성능 유지**: 타입 검증 로직 개선으로 인한 성능 저하 없음
4. **코드 품질**: ESLint, TypeScript 컴파일 오류 없음
5. **문서화**: 변경사항 및 마이그레이션 가이드 작성

---

## 📅 예상 일정

- **계획 수립**: 1일 (완료)
- **Phase 1**: 2-3일
- **Phase 2**: 2-3일  
- **Phase 3**: 1-2일
- **Phase 4**: 3-4일
- **Phase 5**: 1-2일
- **총 소요 시간**: 약 2주

이 계획을 통해 packages/core의 타입 안전성을 크게 향상시키고, 유지보수성을 개선할 수 있을 것으로 예상됩니다.