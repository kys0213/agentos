import React from 'react';
import { ChatSessionDescription } from '@agentos/core';

interface ChatSidebarProps {
  sessions: ChatSessionDescription[];
  currentSessionId?: string;
  onNew: () => void;
  onOpen: (id: string) => void;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({ sessions, currentSessionId, onNew, onOpen }) => {
  return (
    <div style={{ width: '250px', borderRight: '1px solid #ccc', padding: '8px' }}>
      <button onClick={onNew}>New Chat</button>
      <div style={{ marginTop: '8px' }}>
        {sessions.map((s) => (
          <div
            key={s.id}
            onClick={() => onOpen(s.id)}
            style={{
              cursor: 'pointer',
              fontWeight: currentSessionId === s.id ? 'bold' : 'normal',
              marginBottom: '4px',
            }}
          >
            {s.title || '(no title)'}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChatSidebar;
