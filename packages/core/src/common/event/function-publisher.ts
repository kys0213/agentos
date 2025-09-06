import type { EventPublisher } from './event-publisher';

export type PublishFn = (channel: string, payload: unknown) => void | Promise<void>;

export interface FunctionPublisherOptions {
  channelPrefix?: string;
  serializeJson?: boolean;
  onError?: (error: unknown, channel: string, payload: unknown) => void;
}

export class FunctionPublisher implements EventPublisher {
  constructor(
    private readonly fn: PublishFn,
    private readonly options?: FunctionPublisherOptions
  ) {}

  publish(channel: string, payload: unknown): void | Promise<void> {
    const ch = this.options?.channelPrefix ? `${this.options.channelPrefix}${channel}` : channel;
    try {
      const data = this.options?.serializeJson ? JSON.stringify(payload) : payload;
      return this.fn(ch, data);
    } catch (e) {
      this.options?.onError?.(e, ch, payload);
    }
  }
}
