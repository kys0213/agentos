// IpcChannel 관련 모든 exports
export type { IpcChannel } from '../types/ipc-channel';
export { ElectronIpcChannel } from './impl/electron-ipc-channel';
export { MockIpcChannel } from './impl/mock-ipc-channel';
export { IpcChannelFactory, createIpcChannel, getEnvironmentInfo } from './ipc-channel.factory';

// 기본 export는 팩토리 함수
import { createIpcChannel } from './ipc-channel.factory';
export default createIpcChannel;
