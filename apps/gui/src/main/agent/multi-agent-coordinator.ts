import type {
  Agent,
  AgentChatResult,
  AgentExecuteOptions,
  AgentService,
  ReadonlyAgentMetadata,
} from '@agentos/core';
import {
  RouterBuilder,
  BM25TextStrategy,
  KeywordBoostStrategy,
  ToolHintStrategy,
  FileTypeStrategy,
  MentionStrategy,
  type AgentRouter,
} from '@agentos/core';
import type { UserMessage } from 'llm-bridge-spec';

interface CoordinatorExecuteParams {
  primaryAgentId: string;
  messages: UserMessage[];
  mentionedAgentIds: string[];
  options?: AgentExecuteOptions;
}

interface CoordinatorExecution {
  agent: Agent;
  metadata: ReadonlyAgentMetadata;
  result: AgentChatResult;
}

export interface CoordinatorResult {
  sessionId: string;
  executions: CoordinatorExecution[];
}

export class MultiAgentCoordinator {
  private readonly router: AgentRouter;
  private readonly sessionMap = new Map<string, string>();

  constructor(
    private readonly agentService: AgentService,
    router?: AgentRouter
  ) {
    this.router =
      router ??
      RouterBuilder.create()
        .strategies([
          BM25TextStrategy,
          KeywordBoostStrategy,
          ToolHintStrategy,
          FileTypeStrategy,
          MentionStrategy,
        ])
        .build();
  }

  async execute(params: CoordinatorExecuteParams): Promise<CoordinatorResult> {
    const { primaryAgentId, messages, mentionedAgentIds } = params;
    if (messages.length === 0) {
      throw new Error('messages must include at least one user message');
    }

    const agents = await this.selectAgents({
      primaryAgentId,
      messages,
      mentionedAgentIds,
    });

    if (agents.length === 0) {
      throw new Error('No agents available to handle the request');
    }

    const executions: CoordinatorExecution[] = [];
    for (const agent of agents) {
      const execOptions = this.buildExecuteOptions(agent.id, primaryAgentId, params.options);
      const result = await agent.chat(messages, execOptions);
      this.sessionMap.set(agent.id, result.sessionId);
      const metadata = await agent.getMetadata();
      executions.push({ agent, metadata, result });
    }

    const primaryExec = executions.find((e) => e.agent.id === primaryAgentId);
    const sessionId =
      primaryExec?.result.sessionId ??
      executions[0]?.result.sessionId ??
      params.options?.sessionId ??
      primaryAgentId;

    return {
      sessionId,
      executions,
    };
  }

  private async selectAgents(input: {
    primaryAgentId: string;
    messages: UserMessage[];
    mentionedAgentIds: string[];
  }): Promise<Agent[]> {
    const mentionSet = new Set(input.mentionedAgentIds.filter(Boolean));
    const resultMap = new Map<string, Agent>();

    if (mentionSet.size > 0) {
      const orderedIds = [input.primaryAgentId, ...mentionSet];
      for (const agentId of orderedIds) {
        const agent = await this.fetchAgent(agentId);
        if (agent) {
          resultMap.set(agent.id, agent);
        }
      }
      return Array.from(resultMap.values());
    }

    const primary = await this.fetchAgent(input.primaryAgentId);
    if (primary) {
      return [primary];
    }

    const allAgents = await this.loadAllAgents();
    if (allAgents.length === 0) {
      return [];
    }

    const route = await this.router.route(
      {
        messages: [input.messages[input.messages.length - 1]],
        routingHints: [],
      },
      allAgents,
      { topK: Math.min(2, allAgents.length) }
    );

    for (const agent of route.agents) {
      resultMap.set(agent.id, agent);
    }

    if (resultMap.size === 0) {
      // fallback to first available agent if router produced none and primary missing
      resultMap.set(allAgents[0].id, allAgents[0]);
    }

    return Array.from(resultMap.values());
  }

  private buildExecuteOptions(
    agentId: string,
    primaryAgentId: string,
    base?: AgentExecuteOptions
  ): AgentExecuteOptions | undefined {
    const prevSessionId = this.sessionMap.get(agentId);
    const sessionId =
      agentId === primaryAgentId ? (base?.sessionId ?? prevSessionId) : prevSessionId;

    if (!base && !sessionId) {
      return undefined;
    }

    const next: AgentExecuteOptions = {
      ...(base ?? {}),
    };

    if (sessionId) {
      next.sessionId = sessionId;
    } else if ('sessionId' in next) {
      delete next.sessionId;
    }

    return next;
  }

  private async loadAllAgents(): Promise<Agent[]> {
    const page = await this.agentService.listAgents({
      limit: 200,
      cursor: '',
      direction: 'forward',
    });
    return page.items;
  }

  private async fetchAgent(agentId: string): Promise<Agent | null> {
    const agent = await this.agentService.getAgent(agentId);
    return agent;
  }
}
