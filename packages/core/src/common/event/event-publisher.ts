export interface EventPublisher {
  publish(channel: string, payload: unknown): void | Promise<void>;
}
