// 이 파일의 내용은 design-types.ts로 통합되었습니다.
// 하위 호환성을 위해 re-export만 유지합니다.
import type { AppSection, QuickAction, AppModeState } from './design-types';
import type { ChatSessionMetadata, MessageHistory } from '@agentos/core';

// design-types.ts로 통합된 타입들을 re-export
export type { AppSection, QuickAction, AppModeState, ChatSessionMetadata, MessageHistory };
