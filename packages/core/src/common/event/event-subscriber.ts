export type Unsubscribe = () => void;

export interface EventSubscriber {
  on(channel: string, handler: (payload: unknown) => void): Unsubscribe;
}

export type SubscribeFn = (channel: string, handler: (payload: unknown) => void) => Unsubscribe;

export class FunctionSubscriber implements EventSubscriber {
  constructor(private readonly fn: SubscribeFn) {}

  on(channel: string, handler: (payload: unknown) => void): Unsubscribe {
    return this.fn(channel, handler);
  }
}
