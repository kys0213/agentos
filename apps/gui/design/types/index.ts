// Core 타입들을 직접 사용 - renderer/types/design-types.ts와 동일한 패턴
import type { Preset, AgentMetadata, ReadonlyAgentMetadata, KnowledgeState } from '@agentos/core';

// Core 타입 재내보내기
export type { Preset, AgentMetadata, ReadonlyAgentMetadata, KnowledgeState };

// 채팅 UI에서 사용하는 간소화된 Agent 정보
export interface ChatAgent {
  id: string; // Core와 일치하도록 string으로 변경
  name: string;
  preset: string;
}

export type AppSection =
  | 'dashboard'
  | 'chat'
  | 'subagents'
  | 'presets'
  | 'models'
  | 'tools'
  | 'toolbuilder'
  | 'racp'
  | 'settings';
