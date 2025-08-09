import type { IpcChannel } from './ipc/IpcChannel';
import type { AgentMetadata } from '../types/core-types';

/**
 * Agent 관련 기능을 제공하는 서비스 클래스
 * IpcChannel을 통해 환경에 독립적으로 동작
 */
export class AgentService {
  constructor(private ipcChannel: IpcChannel) {}

  // ==================== 기본 Agent 메서드들 ====================

  async getAll(): Promise<AgentMetadata[]> {
    return this.ipcChannel.getAllAgents();
  }

  async create(agent: AgentMetadata): Promise<{ success: boolean }> {
    return this.ipcChannel.createAgent(agent);
  }

  async update(agent: AgentMetadata): Promise<{ success: boolean }> {
    return this.ipcChannel.updateAgent(agent);
  }

  async delete(id: string): Promise<{ success: boolean }> {
    return this.ipcChannel.deleteAgent(id);
  }

  async get(id: string): Promise<AgentMetadata | null> {
    return this.ipcChannel.getAgent(id);
  }

  async getAvailable(): Promise<AgentMetadata[]> {
    return this.ipcChannel.getAvailableAgents();
  }

  async getActive(): Promise<AgentMetadata[]> {
    return this.ipcChannel.getActiveAgents();
  }

  // ==================== 편의 메서드들 ====================

  /**
   * 특정 이름의 Agent가 존재하는지 확인
   */
  async existsByName(name: string): Promise<boolean> {
    const agents = await this.getAll();
    return agents.some((agent) => agent.name === name);
  }

  /**
   * 특정 Preset을 사용하는 모든 Agent 조회
   */
  async getAllByPreset(presetId: string): Promise<AgentMetadata[]> {
    const agents = await this.getAll();
    return agents.filter((agent) => agent.preset.id === presetId);
  }

  /**
   * 키워드로 Agent 검색
   */
  async searchByKeywords(keywords: string[]): Promise<AgentMetadata[]> {
    const agents = await this.getAll();
    return agents.filter((agent) =>
      keywords.some((keyword) =>
        agent.keywords.includes(keyword) ||
        agent.name.toLowerCase().includes(keyword.toLowerCase()) ||
        agent.description.toLowerCase().includes(keyword.toLowerCase())
      )
    );
  }

  /**
   * 상태별 Agent 통계 조회
   */
  async getStatsByStatus(): Promise<Record<string, number>> {
    const agents = await this.getAll();
    const stats: Record<string, number> = {};
    
    agents.forEach((agent) => {
      const status = agent.status;
      stats[status] = (stats[status] || 0) + 1;
    });
    
    return stats;
  }

  /**
   * 최근 사용된 Agent들 조회 (lastUsed 기준)
   */
  async getRecentlyUsed(limit: number = 10): Promise<AgentMetadata[]> {
    const agents = await this.getAll();
    return agents
      .filter((agent) => agent.lastUsed)
      .sort((a, b) => {
        if (!a.lastUsed || !b.lastUsed) return 0;
        return b.lastUsed.getTime() - a.lastUsed.getTime();
      })
      .slice(0, limit);
  }

  /**
   * 사용량이 많은 Agent들 조회 (usageCount 기준)
   */
  async getMostUsed(limit: number = 10): Promise<AgentMetadata[]> {
    const agents = await this.getAll();
    return agents
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, limit);
  }
}