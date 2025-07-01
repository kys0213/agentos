# Slack Bot Channel Preset & Checkpoint Plan

## 요구사항
- 슬랙 채널별 현재 활성화된 preset 을 조회할 수 있어야 한다.
- 슬랙 채널별 preset 을 변경할 수 있어야 한다.
- 에이전트가 동작 중인 스레드마다 개별 체크포인트를 저장하여 이어서 실행할 수 있어야 한다.
- 저장은 우선 로컬 파일을 사용하지만 향후 데이터베이스로 교체하기 쉬운 구조여야 한다.
- 대화 목록 자체는 슬랙 API로 조회하므로 별도 저장하지 않는다.

## 인터페이스 초안
```ts
// packages/agent-slack-bot/src/channel-preset-store.ts
export interface ChannelPresetStore {
  getPreset(channelId: string): Promise<string | null>;
  setPreset(channelId: string, presetId: string): Promise<void>;
  listChannels(): Promise<{ channelId: string; presetId: string }[]>;
}

export class FileBasedChannelPresetStore implements ChannelPresetStore {
  constructor(private baseDir: string) {}
  // ... 구현 예정
}

// packages/agent-slack-bot/src/thread-checkpoint-store.ts
export interface ThreadCheckpointStore {
  getCheckpoint(channelId: string, threadTs: string): Promise<Checkpoint | null>;
  saveCheckpoint(
    channelId: string,
    threadTs: string,
    checkpoint: Checkpoint
  ): Promise<void>;
}

export class FileBasedThreadCheckpointStore implements ThreadCheckpointStore {
  constructor(private baseDir: string) {}
  // ... 구현 예정
}
```
```ts
// packages/agent-slack-bot/src/conversation-store.ts
export interface ConversationStore {
  findThread(id: string): Promise<ConversationThread | null>;
}

export interface ConversationThread {
  getSession(): Promise<ChatSession>;
}

// example usage
const thread = await conversationStore.findThread(threadId);
const session = thread ? await thread.getSession() : null;
```


## Todo 리스트
- [ ] `ChannelPresetStore` 인터페이스와 파일 기반 구현 작성
- [ ] `ThreadCheckpointStore` 인터페이스와 파일 기반 구현 작성
- [ ] `PresetService`가 채널 preset 조회/변경 기능을 제공하도록 수정
- [ ] Slack 명령어에서 채널 preset 확인 및 변경 로직 적용
- [ ] 위 스토어들의 기본 동작을 검증하는 단위 테스트 추가
- [ ] `pnpm lint`, `pnpm build`, `pnpm test` 실행

## 작업 순서
1. `ChannelPresetStore` 및 `FileBasedChannelPresetStore` 파일 추가
2. `ThreadCheckpointStore` 및 구현 파일 추가
3. `PresetService` 수정 및 테스트 코드 작성
4. Slack 봇(`index.ts`)에서 채널별 preset을 사용하도록 업데이트
5. 린트/빌드/테스트 실행 후 커밋
