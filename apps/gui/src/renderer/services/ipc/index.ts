// IpcChannel 관련 모든 exports
export type { IpcChannel } from '../../../shared/types/ipc-channel';
export { ElectronIpcChannel } from './ElectronIpcChannel';
export { MockIpcChannel } from './MockIpcChannel';
export { IpcChannelFactory, createIpcChannel, getEnvironmentInfo } from './IpcChannelFactory';

// 기본 export는 팩토리 함수
import { createIpcChannel } from './IpcChannelFactory';
export default createIpcChannel;
