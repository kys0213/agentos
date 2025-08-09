// Core 타입을 직접 사용
import type { Preset, AgentMetadata, ReadonlyAgentMetadata, KnowledgeState } from '@agentos/core';

// Core 타입 재내보내기
export type { Preset, AgentMetadata, ReadonlyAgentMetadata, KnowledgeState };

// 채팅 UI에서 사용하는 간소화된 Agent 정보
export interface ChatAgent {
  id: string; // Core와 일치하도록 string으로 변경
  name: string;
  preset: string;
}

// AppSection - 애플리케이션 섹션 타입 (두 위치에서 사용되므로 유지)
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
