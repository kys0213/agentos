# GUI ChatApp Refactor Plan

## Requirements
- The `ChatApp` component is growing and becoming hard to maintain.
- Separate responsibilities so each piece has a clear focus.

## Interface Sketch
```ts
// packages/gui/src/renderer/ChatMessageList.tsx
interface ChatMessageListProps {
  messages: Message[];
}

// packages/gui/src/renderer/ChatInput.tsx
interface ChatInputProps {
  onSend(text: string): void;
  disabled?: boolean;
}

// packages/gui/src/renderer/useChatSession.ts
function useChatSession(chatManager: ChatManager): {
  session: ChatSession | null;
  openSession(id: string): Promise<void>;
  startNewSession(preset?: Preset): Promise<void>;
  messages: Message[];
  send(text: string): Promise<void>;
};
```

## Todo
- [ ] Create `ChatMessageList` and `ChatInput` components.
- [ ] Extract session handling logic into `useChatSession` hook.
- [ ] Replace direct state management in `ChatApp` with the new hook and components.
- [ ] Ensure existing features (tabs, sidebar, preset selector) continue to work.
- [ ] Run `pnpm lint` and `pnpm test`.

## Steps
1. Implement `useChatSession` to encapsulate session lifecycle and message flow.
2. Build `ChatMessageList` and `ChatInput` for the chat area UI.
3. Refactor `ChatApp` to use these pieces and remove redundant state.
4. Update or add tests for the new components and hook.
5. Run lint and tests before committing.
