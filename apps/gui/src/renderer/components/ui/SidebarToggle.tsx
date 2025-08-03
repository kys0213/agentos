import React, { useState } from 'react';
import { Button } from '@chakra-ui/react';

interface SidebarToggleProps {
  side: 'left' | 'right';
  className?: string;
}

/**
 * 사이드바 토글 버튼 컴포넌트 (임시 간소화)
 * - store 의존성 제거하여 무한 렌더링 방지
 * - Week 2 UX 기능 테스트 후 복원 예정
 */
const SidebarToggle: React.FC<SidebarToggleProps> = ({ side, className = '' }) => {
  const [isOpen, setIsOpen] = useState(true); // 기본값으로 열린 상태

  const toggle = () => {
    setIsOpen(!isOpen);
    console.log(`${side} sidebar toggle - temporarily using local state`);
  };

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
