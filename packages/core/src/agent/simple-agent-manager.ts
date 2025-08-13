import { validation } from '@agentos/lang';
import type { AgentSearchQuery } from './agent-search';
import { UserMessage } from 'llm-bridge-spec';
import { CursorPagination, CursorPaginationResult } from '../common/pagination/cursor-pagination';
import { paginateByCursor } from '../common/pagination/paginate';
import { Agent, AgentChatResult, AgentExecuteOptions, AgentStatus } from './agent';
import type { AgentSession } from './agent-session';
import {
  AGENT_MANAGER_ERROR_CODES,
  AgentManager,
  AgentManagerError,
  AgentManagerStats,
  validateAgentId,
} from './agent-manager';
import { AgentSearchQuery } from './agent-metadata.repository';

const { isError } = validation;

/**
 * 간단한 Agent 매니저 구현체
 *
 * 메모리 기반으로 Agent들을 관리하며, GUI에서 필요한 모든 기능을 제공합니다.
 */
export class SimpleAgentManager implements AgentManager {
  private readonly agents = new Map<string, Agent>();

  async register(agent: Agent): Promise<void> {
    if (!validateAgentId(agent.id)) {
      throw new AgentManagerError(
        `Invalid agent ID: ${agent.id}`,
        AGENT_MANAGER_ERROR_CODES.INVALID_AGENT_ID
      );
    }

    if (this.agents.has(agent.id)) {
      throw new AgentManagerError(
        `Agent with ID '${agent.id}' already exists`,
        AGENT_MANAGER_ERROR_CODES.AGENT_ALREADY_EXISTS
      );
    }

    this.agents.set(agent.id, agent);
  }

  async unregister(agentId: string): Promise<void> {
    if (!this.agents.has(agentId)) {
      throw new AgentManagerError(
        `Agent with ID '${agentId}' not found`,
        AGENT_MANAGER_ERROR_CODES.AGENT_NOT_FOUND
      );
    }

    const agent = this.agents.get(agentId)!;

    // 실행 중인 Agent는 등록 해제할 수 없음
    if (await agent.isActive()) {
      throw new AgentManagerError(
        `Cannot unregister agent '${agentId}' while it's active`,
        AGENT_MANAGER_ERROR_CODES.OPERATION_FAILED
      );
    }

    this.agents.delete(agentId);
  }

  async getAgent(agentId: string): Promise<Agent | null> {
    return this.agents.get(agentId) || null;
  }

  async getAllAgents(pagination?: CursorPagination): Promise<CursorPaginationResult<Agent>> {
    const allAgents = Array.from(this.agents.values());
    return this.paginateResults(allAgents, pagination);
  }

  async getAvailableAgents(pagination?: CursorPagination): Promise<CursorPaginationResult<Agent>> {
    const list = Array.from(this.agents.values());
    const flags = await Promise.all(
      list.map(async (agent) => ({
        agent,
        active: await agent.isActive(),
        idle: await agent.isIdle(),
      }))
    );
    const availableAgents = flags.filter((f) => f.active || f.idle).map((f) => f.agent);
    return this.paginateResults(availableAgents, pagination);
  }

  async getActiveAgents(pagination?: CursorPagination): Promise<CursorPaginationResult<Agent>> {
    const list = Array.from(this.agents.values());
    const flags = await Promise.all(
      list.map(async (agent) => ({ agent, active: await agent.isActive() }))
    );
    const activeAgents = flags.filter((f) => f.active).map((f) => f.agent);
    return this.paginateResults(activeAgents, pagination);
  }

  /**
   * 별칭: 세션 생성
   */
  async createAgentSession(
    agentId: string,
    options?: { sessionId?: string; presetId?: string }
  ): Promise<AgentSession> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new AgentManagerError(
        `Agent with ID '${agentId}' not found`,
        AGENT_MANAGER_ERROR_CODES.AGENT_NOT_FOUND
      );
    }
    return await agent.createSession(options);
  }

  async execute(
    agentId: string,
    messages: UserMessage[],
    options?: AgentExecuteOptions
  ): Promise<AgentChatResult> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new AgentManagerError(
        `Agent with ID '${agentId}' not found`,
        AGENT_MANAGER_ERROR_CODES.AGENT_NOT_FOUND
      );
    }

    try {
      const result = await agent.chat(messages, options);
      return result;
    } catch (error) {
      throw new AgentManagerError(
        `Failed to execute agent '${agentId}': ${isError(error) ? error.message : 'Unknown error'}`,
        AGENT_MANAGER_ERROR_CODES.AGENT_EXECUTION_FAILED,
        { originalError: error }
      );
    }
  }

  async getAgentStatus(agentId: string): Promise<AgentStatus> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new AgentManagerError(
        `Agent with ID '${agentId}' not found`,
        AGENT_MANAGER_ERROR_CODES.AGENT_NOT_FOUND
      );
    }

    return (await agent.getMetadata()).status;
  }

  async endAgentSession(agentId: string, sessionId: string): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new AgentManagerError(
        `Agent with ID '${agentId}' not found`,
        AGENT_MANAGER_ERROR_CODES.AGENT_NOT_FOUND
      );
    }

    // Agent 인터페이스의 endSession 사용
    if (typeof agent.endSession === 'function') {
      await agent.endSession(sessionId);
    }
  }

  /**
   * 별칭: 세션 종료
   */
  async terminateAgentSession(agentId: string, sessionId: string): Promise<void> {
    return this.endAgentSession(agentId, sessionId);
  }

  async getStats(): Promise<AgentManagerStats> {
    const agents = Array.from(this.agents.values());

    const agentsByStatus: Record<AgentStatus, number> = {
      active: 0,
      idle: 0,
      error: 0,
      inactive: 0,
    };

    let totalActiveSessions = 0;
    let lastActivity: Date | undefined;

    for (const agent of agents) {
      const metadata = await agent.getMetadata();
      agentsByStatus[metadata.status]++;
      totalActiveSessions += metadata.sessionCount;

      if (metadata.lastUsed) {
        if (!lastActivity || metadata.lastUsed > lastActivity) {
          lastActivity = metadata.lastUsed;
        }
      }
    }

    return {
      totalAgents: agents.length,
      agentsByStatus,
      totalActiveSessions,
      lastActivity,
    };
  }

  /**
   * 간단한 메타데이터 기반 검색 구현
   */
  async searchAgents(
    query: AgentSearchQuery,
    pagination?: CursorPagination
  ): Promise<CursorPaginationResult<Agent>> {
    const list = Array.from(this.agents.values());

    // 메타데이터를 병렬 조회
    const withMeta = await Promise.all(
      list.map(async (agent) => ({ agent, meta: await agent.getMetadata() }))
    );

    const filtered = withMeta
      .filter(({ meta }) => this.matchesQuery(meta, query))
      .map(({ agent }) => agent);

    return this.paginateResults(filtered, pagination);
  }

  private matchesQuery(
    meta: Readonly<Awaited<ReturnType<Agent['getMetadata']>>>,
    q: AgentSearchQuery
  ): boolean {
    if (q.status && meta.status !== q.status) return false;

    if (q.name && !meta.name.toLowerCase().includes(q.name.toLowerCase())) return false;

    if (q.description && !meta.description.toLowerCase().includes(q.description.toLowerCase()))
      return false;

    if (Array.isArray(q.keywords) && q.keywords.length > 0) {
      const kw = new Set(q.keywords.map((k) => k.toLowerCase()));
      const has = meta.keywords.some((k) => kw.has(k.toLowerCase()));
      if (!has) return false;
    }

    return true;
  }

  /**
   * 결과를 페이지네이션합니다.
   */
  private paginateResults<T extends { id: string }>(
    items: T[],
    pagination?: CursorPagination
  ): CursorPaginationResult<T> {
    return paginateByCursor(items, pagination);
  }
}
