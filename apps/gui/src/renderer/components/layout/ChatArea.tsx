import React from 'react';
import ChatContainer from '../chat/ChatContainer';
import SettingsContainer from '../settings/SettingsContainer';
import SidebarToggle from '../ui/SidebarToggle';
import { useUIState } from '../../stores/app-store';

/**
 * 메인 채팅 영역 컴포넌트
 * - 절대 침범되지 않는 고정 영역
 * - 채팅과 설정 뷰 전환 관리
 * - CSS Grid 영역 내에서 보호되는 컨테이너
 * - 사이드바 토글 컨트롤 포함
 */
const ChatArea: React.FC = () => {
  const { activeView } = useUIState();

  return (
    <div className="h-full bg-white relative" style={{ minWidth: 0 }}>
      {/* 사이드바 토글 컨트롤 */}
      <div className="absolute top-2 left-2 z-10 flex space-x-1">
        <SidebarToggle side="left" />
      </div>

      <div className="absolute top-2 right-2 z-10">
        <SidebarToggle side="right" />
      </div>

      {/* 메인 콘텐츠 */}
      <div className="h-full pt-12">
        {activeView === 'settings' ? <SettingsContainer /> : <ChatContainer />}
      </div>
    </div>
  );
};

export default ChatArea;
