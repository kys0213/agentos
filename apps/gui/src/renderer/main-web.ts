/**
 * 웹 브라우저 환경 진입점
 * WebIpcChannel을 사용하여 bootstrap 실행
 */
import React from 'react';
import { createRoot } from 'react-dom/client';
import { bootstrap } from './bootstrap';
import { WebIpcChannel } from './services/ipc/WebIpcChannel';
import AppLayoutV2 from './components/layout/AppLayoutV2';
import './styles/globals.css';

console.log('🌐 Starting web application...');

// 웹 환경에서는 WebIpcChannel을 명시적으로 사용
const ipcChannel = new WebIpcChannel();

// Bootstrap 실행
const services = bootstrap(ipcChannel);

console.log('🌐 Web application ready with services:', Object.keys(services));

// 전역에서 접근 가능하도록 설정 (디버깅용)
if (typeof window !== 'undefined') {
  (window as any).__webServices = services;
  (window as any).__debug = {
    channel: ipcChannel,
    ...services,
  };
}

// React 앱 렌더링
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(React.createElement(AppLayoutV2));
  console.log('✅ React app mounted successfully');
} else {
  console.error('❌ Failed to find root element');
}

export default services;
