import React from 'react';
import { useUIState } from '../../stores/app-store';
import LeftSidebar from './LeftSidebar';
import RightSidebar from './RightSidebar';
import ChatArea from './ChatArea';

/**
 * 메인 앱 레이아웃 컴포넌트
 * - CSS Grid 기반 고정 레이아웃
 * - 채팅 영역 절대 보호
 * - 반응형 사이드바 시스템
 * - Tailwind CSS 기반 현대적 스타일링
 */
const AppLayout: React.FC = () => {
  const { leftSidebarOpen, rightSidebarOpen } = useUIState();

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
    <div className={`layout-grid ${getGridClass()}`}>
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
  );
};

export default AppLayout;
