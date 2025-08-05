import { UserMessage } from 'llm-bridge-spec';
import { Agent, AgentStatus, AgentExecuteOptions, AgentRunResult } from './agent';
import {
  AgentSearchQuery,
  AgentManagerStats,
  AgentManagerError,
  AGENT_MANAGER_ERROR_CODES,
  validateAgentId,
  AgentManager,
} from './agent-manager';
import { CursorPagination, CursorPaginationResult } from '../common/pagination/cursor-pagination';

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
    if (agent.status === 'busy') {
      throw new AgentManagerError(
        `Cannot unregister agent '${agentId}' while it's busy`,
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
    const availableAgents = Array.from(this.agents.values()).filter(
      (agent) => agent.status === 'active' || agent.status === 'idle'
    );
    return this.paginateResults(availableAgents, pagination);
  }

  async getActiveAgents(pagination?: CursorPagination): Promise<CursorPaginationResult<Agent>> {
    const activeAgents = Array.from(this.agents.values()).filter(
      (agent) => agent.status === 'active' || agent.status === 'busy'
    );
    return this.paginateResults(activeAgents, pagination);
  }

  async searchAgents(
    query: AgentSearchQuery,
    pagination?: CursorPagination
  ): Promise<CursorPaginationResult<Agent>> {
    let results = Array.from(this.agents.values());

    // 상태 필터
    if (query.status) {
      results = results.filter((agent) => agent.status === query.status);
    }

    // 이름 검색
    if (query.name) {
      const searchName = query.name.toLowerCase();
      results = results.filter((agent) => agent.name.toLowerCase().includes(searchName));
    }

    // 설명 검색
    if (query.description) {
      const searchDesc = query.description.toLowerCase();
      results = results.filter((agent) => agent.description.toLowerCase().includes(searchDesc));
    }

    // 키워드 검색
    if (query.keywords && query.keywords.length > 0) {
      const searchKeywords = query.keywords.map((k) => k.toLowerCase());
      results = results.filter((agent) =>
        searchKeywords.every((searchKeyword) =>
          agent.keywords.some((agentKeyword) => agentKeyword.toLowerCase().includes(searchKeyword))
        )
      );
    }

    return this.paginateResults(results, pagination);
  }

  async execute(
    agentId: string,
    messages: UserMessage[],
    options?: AgentExecuteOptions
  ): Promise<AgentRunResult> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new AgentManagerError(
        `Agent with ID '${agentId}' not found`,
        AGENT_MANAGER_ERROR_CODES.AGENT_NOT_FOUND
      );
    }

    try {
      const result = await agent.run(messages, options);
      return result;
    } catch (error) {
      throw new AgentManagerError(
        `Failed to execute agent '${agentId}': ${error instanceof Error ? error.message : 'Unknown error'}`,
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

    return agent.status;
  }

  async endAgentSession(agentId: string, sessionId: string): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new AgentManagerError(
        `Agent with ID '${agentId}' not found`,
        AGENT_MANAGER_ERROR_CODES.AGENT_NOT_FOUND
      );
    }

    // SimpleAgent의 endSession 메서드 호출 (타입 캐스팅 필요)
    if ('endSession' in agent && typeof agent.endSession === 'function') {
      (agent as any).endSession(sessionId);
    }
  }

  async getStats(): Promise<AgentManagerStats> {
    const agents = Array.from(this.agents.values());

    const agentsByStatus: Record<AgentStatus, number> = {
      active: 0,
      idle: 0,
      busy: 0,
      error: 0,
    };

    let totalActiveSessions = 0;
    let lastActivity: Date | undefined;

    for (const agent of agents) {
      agentsByStatus[agent.status]++;
      totalActiveSessions += agent.sessionCount;

      if (agent.lastActivity) {
        if (!lastActivity || agent.lastActivity > lastActivity) {
          lastActivity = agent.lastActivity;
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
   * 결과를 페이지네이션합니다.
   */
  private paginateResults<T extends { id: string }>(
    items: T[],
    pagination?: CursorPagination
  ): CursorPaginationResult<T> {
    const { cursor, limit = 20 } = pagination || {};

    let filteredItems = items;
    if (cursor) {
      const cursorIndex = items.findIndex((item) => item.id === cursor);
      if (cursorIndex >= 0) {
        filteredItems = items.slice(cursorIndex + 1);
      }
    }

    const paginatedItems = filteredItems.slice(0, limit);
    const nextCursor =
      paginatedItems.length === limit ? paginatedItems[paginatedItems.length - 1].id : '';

    return {
      items: paginatedItems,
      nextCursor,
    };
  }
}
