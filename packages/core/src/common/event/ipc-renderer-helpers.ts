import type { EventSubscriber } from './event-subscriber';
import { parseMaybeJson } from './ipc-payload-guards';

export type Guard<T> = (v: unknown) => v is T;

export function subscribeJson<T>(
  sub: EventSubscriber,
  channel: string,
  guard: Guard<T>,
  handler: (payload: T) => void,
  onInvalid?: (raw: unknown) => void
) {
  return sub.on(channel, (raw) => {
    const v = parseMaybeJson(raw);
    if (guard(v)) {
      handler(v);
    } else {
      onInvalid?.(raw);
    }
  });
}
