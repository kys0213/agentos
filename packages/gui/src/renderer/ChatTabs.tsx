import React from 'react';

export interface ChatTab {
  id: string;
  title: string;
}

export interface ChatTabsProps {
  tabs: ChatTab[];
  activeTabId?: string;
  onSelect: (id: string) => void;
}

const ChatTabs: React.FC<ChatTabsProps> = ({ tabs, activeTabId, onSelect }) => {
  return (
    <div style={{ display: 'flex', borderBottom: '1px solid #ccc' }}>
      {tabs.map((tab) => (
        <div
          key={tab.id}
          onClick={() => onSelect(tab.id)}
          style={{
            cursor: 'pointer',
            padding: '4px 8px',
            borderBottom: activeTabId === tab.id ? '2px solid blue' : '2px solid transparent',
            fontWeight: activeTabId === tab.id ? 'bold' : 'normal',
          }}
        >
          {tab.title || '(no title)'}
        </div>
      ))}
    </div>
  );
};

export default ChatTabs;
