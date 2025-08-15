import type { Unsubscribe } from './event-subscriber';

export type EventMap = Record<string, unknown>;
export type EventHandler<P> = (payload: P) => void;

export class SimpleEventEmitter<E extends EventMap> {
  private readonly handlers: { [K in keyof E]?: Set<EventHandler<E[K]>> } = {};

  on<K extends keyof E>(event: K, handler: EventHandler<E[K]>): Unsubscribe {
    const set = (this.handlers[event] ??= new Set());
    set.add(handler);
    return () => set.delete(handler);
  }

  emit<K extends keyof E>(event: K, payload: E[K]): void {
    const set = this.handlers[event];
    if (!set) return;
    for (const h of set) {
      try {
        h(payload);
      } catch {
        // ignore handler errors
      }
    }
  }
}
