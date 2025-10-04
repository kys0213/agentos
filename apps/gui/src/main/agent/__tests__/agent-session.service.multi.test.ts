import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';
import {
  AgentChatResult,
  FileAgentMetadataRepository,
  FileBasedChatManager,
  FileBasedLlmBridgeRegistry,
  FileBasedSessionStorage,
  McpRegistry,
  MessageHistory,
  SimpleAgentService,
  type CreateAgentMetadata,
} from '@agentos/core';
import type { UserMessage } from 'llm-bridge-spec';
import { DependencyBridgeLoader } from 'llm-bridge-loader';
import { NoopCompressor } from '../../NoopCompressor';
import { AgentEventBridge } from '../events/agent-event-bridge';
import { OutboundChannel } from '../../common/event/outbound-channel';
import { AgentSessionService } from '../agent.service';
import type { ChatService } from '../../chat/chat.service';

class StubChatService implements Pick<ChatService, 'appendMessageToSession'> {
  public appended: { sessionId: string; agentId: string; message: MessageHistory }[] = [];

  async appendMessageToSession(sessionId: string, agentId: string, message: MessageHistory): Promise<void> {
    this.appended.push({ sessionId, agentId, message });
  }
}

describe('AgentSessionService multi-agent integration (SimpleAgentService)', () => {
  let tempDir: string;
  let sessionService: AgentSessionService;
  let chatService: StubChatService;

  beforeEach(async () => {
    tempDir = mkdtempSync(path.join(tmpdir(), 'agentos-multi-'));

    const loader = new DependencyBridgeLoader();
    const llmRegistry = new FileBasedLlmBridgeRegistry(tempDir, loader);
    const loaded = await llmRegistry.loadBridge('e2e-llm-bridge');
    await llmRegistry.register(loaded.manifest, {}, { id: loaded.manifest.name });
    await llmRegistry.setActiveId(loaded.manifest.name);

    const mcpRegistry = new McpRegistry();
    const storage = new FileBasedSessionStorage(path.join(tempDir, 'sessions'));
    const compressor = new NoopCompressor();
    const chatManager = new FileBasedChatManager(storage, compressor, compressor);
    const metadataRepo = new FileAgentMetadataRepository(path.join(tempDir, 'agents'));

    const simpleService = new SimpleAgentService(llmRegistry, mcpRegistry, chatManager, metadataRepo);
    chatService = new StubChatService();
    const outbound = new OutboundChannel();
    const eventBridge = new AgentEventBridge(outbound);
    sessionService = new AgentSessionService(simpleService, eventBridge, chatService as unknown as ChatService);
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  const buildCreateAgentPayload = (name: string): CreateAgentMetadata => {
    const now = new Date();
    return {
      name,
      description: `${name} agent for integration test`,
      icon: '🤖',
      keywords: [],
      status: 'active',
      preset: {
        id: `${name.toLowerCase()}-preset`,
        name: `${name} Preset`,
        description: 'Preset for integration testing',
        author: 'integration-test',
        createdAt: now,
        updatedAt: now,
        version: '1.0.0',
        systemPrompt: `You are ${name}.`,
        enabledMcps: [],
        llmBridgeName: 'e2e-llm-bridge',
        llmBridgeConfig: {
          bridgeId: 'e2e-llm-bridge',
          model: 'e2e-mini',
        },
        status: 'active',
        usageCount: 0,
        knowledgeDocuments: 0,
        knowledgeStats: {
          indexed: 0,
          vectorized: 0,
          totalSize: 0,
        },
        category: ['development'],
      },
    };
  };

  it('routes chat across primary and mentioned agents and returns echo text', async () => {
    const alphaMeta = await sessionService.createAgent(buildCreateAgentPayload('Alpha'));
    const betaMeta = await sessionService.createAgent(buildCreateAgentPayload('Beta'));

    const message: UserMessage = {
      role: 'user',
      content: [{ contentType: 'text', value: 'Summarize the status' }],
    };

    const result: AgentChatResult = await sessionService.chat(
      alphaMeta.id,
      [message],
      undefined,
      [betaMeta.id]
    );

    const assistantMessages = result.messages.filter((msg) => msg.role === 'assistant');
    expect(assistantMessages.length).toBeGreaterThanOrEqual(2);

    const texts = assistantMessages.flatMap((msg) => {
      const segments = Array.isArray(msg.content) ? msg.content : [];
      const flattened = segments.flatMap((segment) =>
        Array.isArray(segment) ? segment : [segment]
      );
      return flattened
        .filter((chunk): chunk is { text: string } =>
          typeof chunk === 'object' && chunk !== null && typeof chunk.text === 'string'
        )
        .map((chunk) => chunk.text);
    });

    expect(texts.length).toBeGreaterThanOrEqual(2);
    expect(texts.every((text) => text.startsWith('E2E response:'))).toBe(true);

    const metadataIds = chatService.appended.map((entry) => entry.message.agentMetadata?.id);
    expect(new Set(metadataIds)).toEqual(new Set([alphaMeta.id, betaMeta.id]));
  });
});
