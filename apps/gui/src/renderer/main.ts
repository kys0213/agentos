/**
 * AgentOS 통합 진입점
 * 환경을 자동 감지하여 적절한 IpcChannel로 bootstrap 실행
 */
import React from 'react';
import { createRoot } from 'react-dom/client';
import { bootstrap } from './bootstrap';
import { createIpcChannel, getEnvironmentInfo } from './services/ipc/IpcChannelFactory';
import NewAppLayout from './components/layout/NewAppLayout';
import './styles/globals.css';

async function initializeApp() {
  // 환경 감지 및 상세 로깅
  const envInfo = getEnvironmentInfo();
  console.log(`🚀 Starting AgentOS in ${envInfo.detected} environment...`);
  console.log('Environment details:', envInfo);

  // 자동 환경 감지로 적절한 IpcChannel 생성
  const ipcChannel = createIpcChannel();
  console.log('📡 IpcChannel created:', ipcChannel.constructor.name);

  // Bootstrap 실행 - 모든 서비스 초기화
  const services = bootstrap(ipcChannel);

  console.log(`✅ AgentOS ready with services:`, Object.keys(services));

  // 디버깅용 전역 설정 - 개발 환경에서만
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    (window as any).__agentosServices = services;
    (window as any).__debug = {
      environment: envInfo,
      channel: ipcChannel,
      services,
    };
    console.log('🔧 Debug objects available at window.__debug and window.__agentosServices');
  }

  // React 앱 렌더링
  const container = document.getElementById('root');
  if (container) {
    const root = createRoot(container);
    root.render(React.createElement(NewAppLayout));
    console.log('⚛️ React app mounted successfully');
  } else {
    console.error('❌ Failed to find root element');
    throw new Error('Root element not found');
  }

  return services;
}

// 에러 처리와 함께 앱 시작
initializeApp()
  .then((services) => {
    console.log('🎉 AgentOS initialization complete');
  })
  .catch((error) => {
    console.error('💥 Failed to initialize AgentOS:', error);
    
    // 에러 UI 표시
    const container = document.getElementById('root');
    if (container) {
      container.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: system-ui;">
          <h1 style="color: #dc2626; margin-bottom: 16px;">🚫 Initialization Failed</h1>
          <p style="color: #6b7280; margin-bottom: 24px;">AgentOS failed to start properly.</p>
          <details style="max-width: 600px; background: #f3f4f6; padding: 16px; border-radius: 8px;">
            <summary style="cursor: pointer; font-weight: bold; margin-bottom: 8px;">Error Details</summary>
            <pre style="white-space: pre-wrap; font-size: 12px; color: #374151;">${error.stack || error.message}</pre>
          </details>
          <button onclick="window.location.reload()" style="margin-top: 24px; padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer;">
            Reload App
          </button>
        </div>
      `;
    }
  });