import React from 'react';
import { Box, Text } from '@chakra-ui/react';

/**
 * 채팅 컨테이너 컴포넌트 (임시 간소화)
 * - store 의존성 제거하여 무한 렌더링 방지
 * - Week 2 UX 기능 테스트 후 복원 예정
 */
const ChatContainer: React.FC = () => {
  return (
    <Box className="h-full flex flex-col p-4">
      <div className="flex-1 flex flex-col space-y-4">
        {/* 헤더 */}
        <div className="border-b pb-2">
          <Text className="text-lg font-semibold text-gray-900">
            Chat Area (Week 2 UX Testing Mode)
          </Text>
          <Text className="text-sm text-gray-600">
            Temporarily simplified to prevent infinite rendering
          </Text>
        </div>

        {/* Mock 채팅 메시지들 */}
        <div className="flex-1 space-y-3">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <Text className="text-sm font-medium text-blue-800">User</Text>
            <Text className="text-gray-700">Hello, this is a mock chat message</Text>
          </div>

          <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <Text className="text-sm font-medium text-gray-800">Assistant</Text>
            <Text className="text-gray-700">This is a mock response from the assistant</Text>
          </div>
        </div>

        {/* Mock 입력창 */}
        <div className="border-t pt-4">
          <div className="p-3 border border-gray-300 rounded bg-white">
            <Text className="text-gray-500 text-sm">
              Mock chat input (functionality disabled during debugging)
            </Text>
          </div>
        </div>
      </div>
    </Box>
  );
};

export default ChatContainer;
