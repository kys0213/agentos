export type RpcMetadata = { senderId?: number; rpcSpecVersion?: string; ts?: number };

export type RpcFrameKind = RpcFrame['kind'];

export type RpcFrame =
  | {
      kind: 'req';
      cid: Cid;
      method: string;
      payload?: unknown;
      meta?: RpcMetadata;
    }
  | { kind: 'res'; cid: Cid; ok: true; result?: unknown }
  | {
      kind: 'err';
      cid: Cid;
      ok: false;
      message: string;
      code: string;
      details?: Record<string, unknown>;
    }
  | { kind: 'nxt'; cid: Cid; data: unknown; seq?: number; method?: string }
  | { kind: 'end'; cid: Cid }
  | { kind: 'can'; cid: Cid };

export type Cid = string;
