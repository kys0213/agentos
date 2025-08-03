import React from 'react';
import { VStack, Button } from '@chakra-ui/react';

/**
 * 좌측 사이드바 컴포넌트 (임시 간소화)
 * - 무한 리렌더링 문제 해결을 위해 단순화
 * - useContextBridge 제거하여 store 의존성 차단
 * - Week 2 UX 기능 테스트 후 복원 예정
 */
const LeftSidebar: React.FC = () => {
  return (
    <div className="h-full flex flex-col p-4 bg-gray-50">
      {/* 임시 메뉴 */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">AgentOS Chat</h3>
          <p className="text-sm text-gray-600">Week 2 UX Testing Mode</p>
        </div>

        {/* Mock Chat Sessions */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Chat Sessions</h4>
          <div className="space-y-1">
            <div className="p-2 bg-blue-50 border border-blue-200 rounded text-sm">
              📝 Mock Chat Session 1
            </div>
            <div className="p-2 bg-gray-100 border border-gray-200 rounded text-sm">
              📝 Mock Chat Session 2
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <Button
            w="100%"
            colorScheme="blue"
            variant="solid"
            size="sm"
            onClick={() => console.log('New Chat clicked')}
          >
            ➕ New Chat
          </Button>

          <Button
            w="100%"
            colorScheme="gray"
            variant="outline"
            size="sm"
            onClick={() =>
              console.log('Settings clicked - temporarily disabled to prevent infinite loop')
            }
          >
            ⚙️ Settings
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LeftSidebar;
