import type { EventPublisher } from './event-publisher';

export class CompositePublisher implements EventPublisher {
  constructor(private readonly targets: readonly EventPublisher[]) {}

  publish(channel: string, payload: unknown): void {
    for (const p of this.targets) {
      try {
        p.publish(channel, payload);
      } catch {
        // isolate failures between targets
      }
    }
  }
}
