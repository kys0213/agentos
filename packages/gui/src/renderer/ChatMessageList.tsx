import React, { useEffect, useRef } from 'react';

export interface Message {
  sender: 'user' | 'agent';
  text: string;
}

export interface ChatMessageListProps {
  messages: Message[];
}

const ChatMessageList: React.FC<ChatMessageListProps> = ({ messages }) => {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div
      style={{
        height: '400px',
        overflowY: 'auto',
        border: '1px solid #ccc',
        padding: '8px',
      }}
    >
      {messages.map((m, idx) => (
        <div key={idx} style={{ marginBottom: '8px' }}>
          <strong>{m.sender === 'user' ? 'You' : 'Agent'}:</strong> {m.text}
        </div>
      ))}
      <div ref={endRef} />
    </div>
  );
};

export default ChatMessageList;
