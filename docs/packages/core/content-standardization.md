# Core Content Standardization Plan (llm-bridge-spec alignment)

## 배경 / 문제

- GUI와 브릿지 간 메시지 콘텐츠 포맷이 혼재되어 변환 코드가 다수 존재
- 유지보수/테스트 비용 증가, 멀티모달 확장 시 일관성 저하

## 목표

- Core에서 단일 콘텐츠 포맷을 표준화하여 모든 레이어에서 일관 사용
- 표준 포맷: llm-bridge-spec의 MultiModalContent(contentType/value)
- 메시지 content는 배열(Core 표준)로 통일, 단일/배열 입력은 정규화 유틸로 수용

## 타입 설계 (초안)

```ts
// packages/core/src/chat/content.ts
import type { MultiModalContent as BridgeContent } from 'llm-bridge-spec';

export type CoreContent = BridgeContent;

export interface CoreMessage {
  messageId: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: CoreContent[]; // 표준: 배열
  createdAt: Date;
  meta?: Record<string, unknown>;
}

export function toCoreContentArray(
  input: CoreContent | CoreContent[] | null | undefined
): CoreContent[] {
  if (!input) return [];
  return Array.isArray(input) ? input : [input];
}
```

## 어댑터 정책

- Bridge 어댑터: Core와 llm-bridge-spec 간 매핑 최소화(필드 동일)
- GUI 레거시 어댑터(존재 시): {contentType,value} 단일 ↔ CoreContent[] 정규화(점진 제거)

## DX/확장성

- 멀티모달 확장 시 배열 append 패턴으로 일관 처리
- 인터셉터/미들웨어(보안/압축/필터링/로깅)에서 CoreContent[] 기준 정책 적용
- 테스트 단순화: 느슨한 입력 → 정규화 → 내부는 항상 동일 타입

## 성공 기준

- Core 내 모든 메시지 경로가 CoreContent[] 사용
- GUI/CLI/IPC/브릿지 경계 외 변환 코드 제거/최소화
- 단일/배열 입력 모두 안전 처리(타입/런타임 정규화)

## TODO (Phase 1)

- [x] TODO 1: packages/core/src/chat/content.ts 신설(CoreContent, CoreMessage, toCoreContentArray)
- [x] TODO 2: (옵션) normalizeContent 유틸 추가 - 느슨한 입력 정규화
- [ ] TODO 3: 코어 사용처 점검(MessageHistory 등) → CoreMessage 호환 표 작성
- [ ] TODO 4: 문서/가이드 업데이트 및 샘플 추가
- [x] TODO 5: 단위 테스트(정규화/단일/배열)

## TODO (Phase 2)

- [ ] TODO 6: GUI/CLI 경계에 toCoreContentArray 적용 → 내부 배열 표준화
- [ ] TODO 7: 레거시 {contentType,value} 단일 사용처 단계적 제거
- [ ] TODO 8: E2E/통합 테스트로 회귀 방지

## 영향 파일(초안)

- packages/core/src/chat/content.ts (신규)
- packages/core/src/\*\*/ (메시지 처리 지점 호환 보강)
- apps/gui/src/\*\*/ (경계부 정규화)
- apps/cli/src/\*\*/ (경계부 정규화)

## 마이그레이션 가이드(요약)

1. Core 표준 타입 추가 → 내부 배열 표준 유지
2. GUI/CLI/IPC/브릿지 경계에서만 정규화
3. 단일 콘텐츠 사용 코드는 점진 제거 + 테스트 강화

---

- 참고: llm-bridge-spec MultiModalContent 스키마 표준 채택
- 장점: 변환 레이어 제거, 멀티모달 확장 용이, 정책/인터셉터 일원화
