import React from 'react';
import { bootstrap, isBootstrapped } from '../bootstrap';
import AppLayout from '../components/layout/AppLayout';

// Bootstrap services if not already done
if (!isBootstrapped()) {
  bootstrap();
}

/**
 * 메인 ChatApp 컴포넌트
 * - 이제 단순히 AppLayout을 렌더링하는 역할
 * - 모든 복잡한 로직은 각 컴포넌트로 분리됨
 * - 230줄 → 15줄로 대폭 간소화
 */
const ChatApp: React.FC = () => {
  return <AppLayout />;
};

export default ChatApp;
