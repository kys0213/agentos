import React from 'react';
import renderer from 'react-test-renderer';
import { ChatView } from '../../ChatView';
import type { ReadonlyAgentMetadata, MessageHistory } from '@agentos/core';

const agent = (id: string, name: string): ReadonlyAgentMetadata => ({
  id,
  name,
  description: '',
  keywords: [],
  preset: { id: 'p', name: 'Preset', category: ['development'] } as any,
  status: 'active',
});

describe('ChatView header chips', () => {
  it('renders active agent chip and Manage Agents button', () => {
    const comp = renderer.create(
      <ChatView
        onNavigate={() => {}}
        agents={[agent('1', 'Alpha')]}
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
