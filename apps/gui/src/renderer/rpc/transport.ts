export interface RpcTransport {
  // Sends a single-shot request over a channel and resolves with the result
  request<TRes = unknown, TReq = unknown>(channel: string, payload?: TReq): Promise<TRes>;

  // Subscribes to a channel as a stream; resolves to an unsubscribe function
  // The consumer can wrap this into an AsyncGenerator if desired
  stream?<T = unknown>(channel: string, handler: (data: T) => void): Promise<() => void>;
}

