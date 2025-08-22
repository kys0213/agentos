import React from 'react';

// Import new design hooks for Chat mode only
import { useAppData } from '../hooks/useAppData';
import { useAppNavigation } from '../hooks/useAppNavigation';

// Chat 컨테이너 적용
import { ChatViewContainer } from './chat/ChatViewContainer';
import ManagementView from './layout/ManagementView';

/**
 * New App Layout - 새 디자인 기반으로 완전히 재작성된 버전
 *
 * Chat 모드와 Management 모드를 분리
 * - Chat 모드: 이곳에서 관리
 * - Management 모드: ManagementView에서 자체 관리
 * - design/App.tsx 구조를 따름
 */
const NewAppLayout: React.FC = () => {
  const navigation = useAppNavigation();

  const appData = useAppData();
  const { activeSection, setActiveSection } = navigation;

  // Chat Mode: Full screen ChatView with integrated ChatHistory sidebar
  if (activeSection === 'chat') {
    // Always render ChatViewContainer; it handles loading/empty internally
    return (
      <div className="h-screen bg-background">
        <ChatViewContainer onNavigate={setActiveSection} />
      </div>
    );
  }

  // Management Mode: ManagementView now handles its own navigation
  return <ManagementView navigation={navigation} />;
};

export default NewAppLayout;
