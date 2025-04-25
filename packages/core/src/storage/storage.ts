export interface Storage {
  save<T extends Serializable>(session: T): Promise<void>;
  load<T extends Serializable>(sessionId: string): Promise<T>;
  delete(sessionId: string): Promise<void>;
  deleteAll(): Promise<void>;
}

export type Serializable = Record<string, unknown> | Array<unknown>;
