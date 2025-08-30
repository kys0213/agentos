import { safeZone } from '@agentos/lang/utils';

export class Scheduler {
  private constructor(private readonly ms: number) {}

  static create(ms: number) {
    return new Scheduler(ms);
  }

  private timerId: NodeJS.Timeout | null = null;

  start(job: () => void | Promise<void>) {
    this.timerId = setInterval(() => {
      safeZone(job);
    }, this.ms);
  }

  isRunning() {
    return this.timerId !== null;
  }

  stop() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }
}
