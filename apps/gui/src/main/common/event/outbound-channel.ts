import { Injectable } from '@nestjs/common';
import { Observable, Subject, filter } from 'rxjs';

export interface OutboundEvent<T = unknown> {
  type: string; // e.g., 'agent.session.message'
  payload: T;
  ts?: number;
}

@Injectable()
export class OutboundChannel {
  private readonly subj = new Subject<OutboundEvent>();

  emit<T = unknown>(event: OutboundEvent<T>): void {
    this.subj.next({ ...event, ts: event.ts ?? Date.now() });
  }

  stream(): Observable<OutboundEvent> {
    return this.subj.asObservable();
  }

  ofType(pattern: string | RegExp): Observable<OutboundEvent> {
    return this.stream().pipe(
      filter((ev) =>
        typeof pattern === 'string' ? ev.type.startsWith(pattern) : pattern.test(ev.type)
      )
    );
  }
}

