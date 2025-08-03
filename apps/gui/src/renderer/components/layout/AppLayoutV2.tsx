import React, { useState } from 'react';
import { AppModeState } from '../../types/chat-types';
import ChatView from '../chat/ChatView';
import ManagementView from '../management/ManagementView';

/**
 * 새로운 앱 레이아웃 - Figma 디자인 기반
 * - 듀얼 모드: chat ↔ management
 * - 채팅 중심 인터페이스가 기본
 */
const AppLayoutV2: React.FC = () => {
  const [appMode, setAppMode] = useState<AppModeState>({
    mode: 'chat',
    activeSection: 'dashboard',
  });

  const handleNavigateToManagement = (section: AppModeState['activeSection']) => {
    setAppMode({
      mode: 'management',
      activeSection: section,
    });
  };

  const handleNavigateToChat = () => {
    setAppMode({
      mode: 'chat',
      activeSection: appMode.activeSection,
    });
  };

  const handleSectionChange = (section: AppModeState['activeSection']) => {
    setAppMode((prev) => ({
      ...prev,
      activeSection: section,
    }));
  };

  return (
    <div className="h-screen bg-background overflow-hidden">
      {appMode.mode === 'chat' ? (
        <ChatView onNavigate={handleNavigateToManagement} />
      ) : (
        <ManagementView
          activeSection={appMode.activeSection}
          onSectionChange={handleSectionChange}
          onBackToChat={handleNavigateToChat}
          onOpenChat={(_agentId, _agentName, _agentPreset) => {
            // Could pass these to ChatView if needed for specific agent selection
            handleNavigateToChat();
          }}
        />
      )}
    </div>
  );
};

export default AppLayoutV2;
