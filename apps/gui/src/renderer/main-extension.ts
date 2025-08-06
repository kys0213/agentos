/**
 * Chrome Extension 환경 진입점
 * ChromeExtensionIpcChannel을 사용하여 bootstrap 실행
 */
import React from 'react';
import { createRoot } from 'react-dom/client';
import { bootstrap } from './bootstrap';
import { ChromeExtensionIpcChannel } from './services/ipc/ChromeExtensionIpcChannel';
import AppLayout from './components/layout/AppLayout';
import './styles/globals.css';

console.log('🧩 Starting Chrome Extension...');

// Chrome Extension 환경에서는 ChromeExtensionIpcChannel을 명시적으로 사용
const ipcChannel = new ChromeExtensionIpcChannel();

// Bootstrap 실행
const services = bootstrap(ipcChannel);

console.log('🧩 Chrome Extension ready with services:', Object.keys(services));

// 전역에서 접근 가능하도록 설정 (디버깅용)
if (typeof window !== 'undefined') {
  (window as any).__extensionServices = services;
  (window as any).__debug = {
    channel: ipcChannel,
    ...services,
  };
}

// React 앱 렌더링
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(React.createElement(AppLayout));
  console.log('✅ React app mounted successfully');
} else {
  console.error('❌ Failed to find root element');
}

export default services;
