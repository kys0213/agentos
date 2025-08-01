import React from 'react';
import { Button } from '@chakra-ui/react';
import { useUIState, useUIActions } from '../../stores/app-store';

interface SidebarToggleProps {
  side: 'left' | 'right';
  className?: string;
}

/**
 * 사이드바 토글 버튼 컴포넌트
 * - 좌/우 사이드바 독립적 토글
 * - 반응형 아이콘 표시
 * - 접근성 지원
 */
const SidebarToggle: React.FC<SidebarToggleProps> = ({ side, className = '' }) => {
  const { leftSidebarOpen, rightSidebarOpen } = useUIState();
  const { toggleLeftSidebar, toggleRightSidebar } = useUIActions();

  const isOpen = side === 'left' ? leftSidebarOpen : rightSidebarOpen;
  const toggle = side === 'left' ? toggleLeftSidebar : toggleRightSidebar;

  const icon =
    side === 'left'
      ? isOpen
        ? '◁'
        : '▷' // 좌측: 왼쪽/오른쪽 화살표
      : isOpen
        ? '▷'
        : '◁'; // 우측: 오른쪽/왼쪽 화살표

  const ariaLabel = `Toggle ${side} sidebar ${isOpen ? 'closed' : 'open'}`;

  return (
    <Button
      onClick={toggle}
      size="sm"
      variant="ghost"
      className={`transition-all duration-300 hover:bg-gray-100 ${className}`}
      aria-label={ariaLabel}
      title={ariaLabel}
    >
      <span className="text-gray-600 text-lg font-mono">{icon}</span>
    </Button>
  );
};

export default SidebarToggle;
