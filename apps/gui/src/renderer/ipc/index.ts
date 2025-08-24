// IpcChannel 관련 모든 exports
export type { IpcChannel } from '../../shared/types/ipc-channel';
export { ElectronIpcChannel } from './electron-ipc-channel';
export { MockIpcChannel } from './mock-ipc-channel';
export {
  RpcTransportFactory as IpcChannelFactory,
  createRpcTransport as createIpcChannel,
  getEnvironmentInfo,
} from '../rpc/rpc-channel.factory';
