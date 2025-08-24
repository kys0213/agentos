/**
 * AgentOS 통합 진입점
 * 환경을 자동 감지하여 적절한 IpcChannel로 bootstrap 실행
 */
import React from 'react';
import { createRoot } from 'react-dom/client';
import { bootstrap } from './bootstrap';
import { createRpcTransport, getEnvironmentInfo } from './ipc/ipc-channel.factory';
import NewAppLayout from './components/App';
import { QueryProvider } from './providers/QueryProvider';
import './styles/globals.css';
import { waitForRpcReady } from './rpc/waitForReady';

async function initializeApp() {
  await waitForRpcReady();

  const envInfo = getEnvironmentInfo();

  console.log(`🚀 Starting AgentOS in ${envInfo.detected} environment...`);
  console.log('Environment details:', envInfo);

  const rpcTransport = createRpcTransport();
  console.log('📡 IpcChannel created:', rpcTransport.constructor.name);

  await bootstrap(rpcTransport);

  const container = document.getElementById('root');
  if (container) {
    const root = createRoot(container);
    root.render(React.createElement(QueryProvider, null, React.createElement(NewAppLayout)));
    console.log('⚛️ React app mounted successfully');
  } else {
    console.error('❌ Failed to find root element');
    throw new Error('Root element not found');
  }
}

// 에러 처리와 함께 앱 시작
initializeApp()
  .then(() => {
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
