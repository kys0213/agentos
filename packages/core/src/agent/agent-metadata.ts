import { Preset } from '../preset/preset';
import { AgentStatus } from './agent';

/**
 * Agent 메타데이터
 */
export interface AgentMetadata {
  /** Agent 고유 식별자 */
  id: string;

  /** Agent 이름 */
  name: string;

  /** Agent 설명 */
  description: string;

  /** Agent 아이콘 (이모지 또는 아이콘 이름) */
  icon: string;

  /** Agent 키워드 */
  keywords: readonly string[];

  /** Agent가 사용하는 Preset */
  preset: Readonly<Preset>;

  /** 현재 Agent 상태 */
  status: Readonly<AgentStatus>;

  /** 마지막 활동 시간 */
  lastUsed?: Date;

  /** 현재 처리 중인 세션 수 */
  sessionCount: number;

  /** 사용 횟수 */
  usageCount: number;
}

export type ReadonlyAgentMetadata = Readonly<AgentMetadata>;

export type CreateAgentMetadata = Omit<
  AgentMetadata,
  'id' | 'lastUsed' | 'sessionCount' | 'usageCount'
>;
