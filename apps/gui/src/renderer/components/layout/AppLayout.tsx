import React, { useState } from 'react';
import LeftSidebar from './LeftSidebar';
import RightSidebar from './RightSidebar';
import ChatArea from './ChatArea';
import CommandPalette from '../ui/CommandPalette';
import SettingsPanel from '../ui/SettingsPanel';

/**
 * 메인 앱 레이아웃 컴포넌트 (임시 간소화)
 * - store 의존성 제거하여 무한 렌더링 방지
 * - Week 2 UX 기능 테스트 후 복원 예정
 */
const AppLayout: React.FC = () => {
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);

  // CSS Grid 클래스 결정
  const getGridClass = () => {
    if (leftSidebarOpen && rightSidebarOpen) {
      return 'layout-grid-full';
    } else if (leftSidebarOpen) {
      return 'layout-grid-left';
    } else if (rightSidebarOpen) {
      return 'layout-grid-right';
    } else {
      return 'layout-grid-center';
    }
  };

  return (
    <>
      {/* CommandPalette 제거하고 직접 레이아웃 렌더링 */}
      <div className={`layout-grid ${getGridClass()}`} data-testid="app-layout">
        {/* 좌측 사이드바 - 네비게이션 + 액션 */}
        <div className={`sidebar sidebar-left ${leftSidebarOpen ? 'block' : 'hidden'}`}>
          <LeftSidebar />
        </div>

        {/* 메인 채팅 영역 - 절대 침범되지 않는 고정 영역 */}
        <div className="chat-area grid-area-safe">
          <ChatArea />
        </div>

        {/* 우측 사이드바 - 히스토리 + 컨텍스트 */}
        <div className={`sidebar sidebar-right ${rightSidebarOpen ? 'block' : 'hidden'}`}>
          <RightSidebar />
        </div>
      </div>

      {/* 설정 패널 - 고정 위치, 채팅 영역과 독립적 */}
      <SettingsPanel />

      {/* CommandPalette 별도 렌더링 */}
      <CommandPalette />
    </>
  );
};

export default AppLayout;
