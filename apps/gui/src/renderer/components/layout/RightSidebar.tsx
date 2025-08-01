import React from 'react';
import { Text } from '@chakra-ui/react';

/**
 * 우측 사이드바 컴포넌트
 * - 향후 히스토리, 컨텍스트, 메타데이터 표시용
 * - 현재는 플레이스홀더로 구현
 * - CSS Grid와 Tailwind 활용한 현대적 스타일링
 */
const RightSidebar: React.FC = () => {
  return (
    <div className="h-full p-4">
      <div className="flex flex-col space-y-4">
        <Text fontSize="lg" fontWeight="semibold" className="text-gray-800">
          Context Panel
        </Text>

        <Text color="gray.600" fontSize="sm">
          향후 구현 예정:
        </Text>

        <div className="flex flex-col space-y-2 text-sm text-gray-500">
          <Text>• 대화 히스토리</Text>
          <Text>• 컨텍스트 정보</Text>
          <Text>• 메타데이터</Text>
          <Text>• 관련 링크</Text>
          <Text>• 성능 모니터링</Text>
          <Text>• 디버그 정보</Text>
        </div>

        {/* 향후 구현될 기능들의 플레이스홀더 */}
        <div className="mt-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <Text fontSize="xs" color="blue.600" fontWeight="medium">
            Coming Soon
          </Text>
          <Text fontSize="xs" color="blue.500" mt={1}>
            실시간 성능 모니터링과 컨텍스트 추적 기능이 여기에 표시됩니다.
          </Text>
        </div>
      </div>
    </div>
  );
};

export default RightSidebar;
