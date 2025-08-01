/**
 * Chrome Extension 환경 진입점
 * ChromeExtensionIpcChannel을 사용하여 bootstrap 실행
 */
import { bootstrap } from './bootstrap';
import { ChromeExtensionIpcChannel } from './services/ipc/ChromeExtensionIpcChannel';

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

export default services;
