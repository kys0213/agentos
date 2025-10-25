# CLI LLM Bridge Plan

## 요구사항

- CLI에서 LLM 호출을 `llm-bridge-loader`를 사용하도록 변경한다.
- `createManager` 호출 시 LLM Bridge를 동적으로 주입할 수 있어야 한다.
- 대화 내용 요약 기능도 LLM Bridge를 이용해 실제 LLM에게 요약을 요청하도록 수정한다.

## 인터페이스 초안

```ts
// packages/cli/src/chat-manager.ts
export interface ChatManagerFactory {
  create(llmBridge: LlmBridge): ChatManager;
}

export const createManager: ChatManagerFactory['create'];

// packages/cli/src/llm-compressor.ts
export class LlmCompressor implements CompressStrategy {
  constructor(private bridge: LlmBridge) {}
  compress(messages: MessageHistory[]): Promise<CompressionResult>;
}
```

## Todo 리스트

- [ ] `packages/cli` 의 `package.json` 에 `llm-bridge-loader` 의존성 추가
- [ ] `createManager` 가 `llmBridge` 인자를 받아 Compressor에도 전달하도록 수정
- [ ] `LlmCompressor` 구현
- [ ] `interactiveChat`에서 `SimpleAgent`와 전달된 LLM Bridge를 사용해 응답 생성
- [ ] 코드 포맷팅 및 린트 실행
- [ ] `pnpm build` 와 `pnpm test` 실행

## 작업 순서

1. `package.json` 수정 후 의존성 설치
2. `LlmCompressor` 구현 파일 작성
3. `createManager` 및 `bootstrap.ts` 수정하여 LLM Bridge 인자 전달 구조 반영
4. `interactiveChat`을 SimpleAgent + LLM Bridge 기반 로직으로 교체
5. lint/build/test 실행 후 결과 확인
