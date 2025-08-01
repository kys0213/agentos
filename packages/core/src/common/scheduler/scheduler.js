"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Scheduler = void 0;
const safeZone_1 = require("../utils/safeZone");
class Scheduler {
    ms;
    constructor(ms) {
        this.ms = ms;
    }
    static create(ms) {
        return new Scheduler(ms);
    }
    timerId = null;
    start(job) {
        this.timerId = setInterval(() => {
            (0, safeZone_1.safeZone)(job);
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
exports.Scheduler = Scheduler;
//# sourceMappingURL=scheduler.js.map