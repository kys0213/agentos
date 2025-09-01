import React from 'react';
import renderer from 'react-test-renderer';
import { ChatHistory } from '../ChatHistory';

describe('ChatHistory UI', () => {
  it('renders Archived pill and empty state when no agents', () => {
    const comp = renderer.create(
      <ChatHistory
        agents={[]}
        onSelectChat={() => {}}
        selectedChatId={undefined}
        lastMessageByAgentId={{}}
      />
    );
    const tree = comp.toJSON();
    const html = JSON.stringify(tree);
    expect(html).toContain('Archived (0)');
    expect(html).toContain('No conversations yet');
  });
});
