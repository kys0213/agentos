import React from 'react';
import { bootstrap, isBootstrapped } from '../bootstrap';
import AppLayoutV2 from '../components/layout/AppLayoutV2';

// Bootstrap services if not already done
if (!isBootstrapped()) {
  bootstrap();
}

/**
 * 메인 ChatApp 컴포넌트 - Figma 디자인 기반으로 업데이트
 * - AppLayoutV2로 전환 (채팅 중심 듀얼 모드)
 * - Mock 데이터 서비스 활용
 * - AI 리즈닝 모드 및 에이전트 시스템 지원
 */
const ChatApp: React.FC = () => {
  return <AppLayoutV2 />;
};

export default ChatApp;
