// IpcChannel 관련 모든 exports
export type { IpcChannel } from './IpcChannel';
export { ElectronIpcChannel } from './ElectronIpcChannel';
export { WebIpcChannel } from './WebIpcChannel';
export { ChromeExtensionIpcChannel } from './ChromeExtensionIpcChannel';
export { MockIpcChannel } from './MockIpcChannel';
export { IpcChannelFactory, createIpcChannel, getEnvironmentInfo } from './IpcChannelFactory';

// 기본 export는 팩토리 함수
import { createIpcChannel } from './IpcChannelFactory';
export default createIpcChannel;
