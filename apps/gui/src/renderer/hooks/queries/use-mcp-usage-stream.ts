import { useEffect, useState } from 'react';
import { ServiceContainer } from '../../../shared/di/service-container';
import type { McpUsageUpdateEvent } from '../../../shared/types/mcp-usage-types';

export function useMcpUsageStream() {
  const [lastEvent, setLastEvent] = useState<McpUsageUpdateEvent | null>(null);

  useEffect(() => {
    const svc = ServiceContainer.get('mcpUsageLog');
    if (!svc || typeof svc.subscribeToUsageUpdates !== 'function') {
      return;
    }
    let close: (() => void) | undefined;
    (async () => {
      close = await svc.subscribeToUsageUpdates((ev) => setLastEvent(ev));
    })();
    return () => {
      if (close) {
        close();
      }
    };
  }, []);

  return { lastEvent };
}
