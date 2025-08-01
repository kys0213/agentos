export declare class Scheduler {
    private readonly ms;
    private constructor();
    static create(ms: number): Scheduler;
    private timerId;
    start(job: () => void | Promise<void>): void;
    isRunning(): boolean;
    stop(): void;
}
//# sourceMappingURL=scheduler.d.ts.map