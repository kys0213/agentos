import React from 'react';
import renderer from 'react-test-renderer';
import { ChatView } from '../../ChatView';
import type { ReadonlyAgentMetadata, MessageHistory } from '@agentos/core';
import type { ReadonlyPreset } from '@agentos/core';

const makePreset = (): ReadonlyPreset => ({
  id: 'p',
  name: 'Preset',
  description: '',
  author: 'test',
  createdAt: new Date(0),
  updatedAt: new Date(0),
  version: '1.0.0',
  systemPrompt: '',
  llmBridgeName: 'none',
  llmBridgeConfig: {},
  status: 'active',
  usageCount: 0,
  knowledgeDocuments: 0,
  knowledgeStats: { indexed: 0, vectorized: 0, totalSize: 0 },
  category: ['development'],
});

const agent = (id: string, name: string): ReadonlyAgentMetadata => ({
  id,
  name,
  description: '',
  icon: '',
  keywords: [],
  preset: makePreset(),
  status: 'active',
  sessionCount: 0,
  usageCount: 0,
});

describe('ChatView header chips', () => {
  it('renders active agent chip and Manage Agents button', () => {
    const comp = renderer.create(
      <ChatView
        onNavigate={() => {}}
        mentionableAgents={[agent('1', 'Alpha')]}
        activeAgents={[agent('1', 'Alpha')]}
        messages={[] as Readonly<MessageHistory>[]}
        selectedAgentId={'1'}
        onSelectAgent={() => {}}
        onSendMessage={() => {}}
      />
    );
    const html = JSON.stringify(comp.toJSON());
    expect(html).toContain('Alpha');
    expect(html).toContain('Active');
    expect(html).toContain('Manage Agents');
  });
});
