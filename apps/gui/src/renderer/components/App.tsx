import React, { useEffect } from 'react';
import { Button } from './ui/button';

// Import new design hooks for Chat mode only
import { useAppNavigation } from '../hooks/useAppNavigation';
import { useAppData } from '../hooks/useAppData';

// Chat 컨테이너 적용
import { ChatViewContainer } from './chat/ChatViewContainer';
import ManagementView from './layout/ManagementView';
import { bootstrap, isBootstrapped } from '../bootstrap';

/**
 * New App Layout - 새 디자인 기반으로 완전히 재작성된 버전
 *
 * Chat 모드와 Management 모드를 분리
 * - Chat 모드: 이곳에서 관리
 * - Management 모드: ManagementView에서 자체 관리
 * - design/App.tsx 구조를 따름
 */
const NewAppLayout: React.FC = () => {
  useEffect(() => {
    // Ensure services are registered when running web dev entry (vite)
    if (!isBootstrapped()) {
      try {
        bootstrap();
      } catch (e) {
        console.error('Failed to bootstrap services:', e);
      }
    }
  }, []);

  const navigation = useAppNavigation();

  const appData = useAppData();

  const { activeSection, setActiveSection } = navigation;
  const { currentAgents } = appData;

  // Chat Mode: Full screen ChatView with integrated ChatHistory sidebar
  if (activeSection === 'chat') {
    if (currentAgents.length === 0) {
      return (
        <div className="h-screen bg-background flex items-center justify-center">
          <div className="max-w-lg">
            {/* TODO: Replace with actual EmptyState component in Phase 2 */}
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">Welcome to AgentOS</h2>
              <p className="text-muted-foreground mb-6">
                To start chatting, you'll need to create at least one AI agent. Agents are your
                AI-powered assistants that can help with various tasks.
              </p>
              <Button onClick={() => setActiveSection('subagents')} className="mr-4">
                Create First Agent
              </Button>
              <Button variant="outline" onClick={() => setActiveSection('dashboard')}>
                Explore Features
              </Button>
            </div>
          </div>
        </div>
      );
    }

    // 컨테이너 기반 ChatView 렌더링
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
