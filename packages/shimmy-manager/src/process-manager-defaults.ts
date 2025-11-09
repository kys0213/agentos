export class ShimmyProcessDefaults {
  static readonly MAX_RESTARTS = 1;
  static readonly PORT_RETRY_LIMIT = 10;
  static readonly RESTART_DELAY_MS = 1_000;
  static readonly HEALTHCHECK_INTERVAL_MS = 1_000;
  static readonly HEALTHCHECK_REQUEST_TIMEOUT_MS = 5_000;
  static readonly TERMINATE_GRACE_MS = 5_000;
  static readonly BIND_HOST = '127.0.0.1';
}
