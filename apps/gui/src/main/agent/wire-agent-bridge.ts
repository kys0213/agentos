import { AgentEventBridge, FunctionPublisher } from '@agentos/core';
import type { AgentManager } from '@agentos/core';
import { broadcast } from '../utils/broadcast';

/**
 * Wires core AgentEventBridge to broadcast IPC events to all renderer windows.
 * Usage (when AgentManager is available):
 *   const bridge = wireAgentBridge(agentManager);
 *   await bridge.attachAll();
 */
export function wireAgentBridge(manager: AgentManager) {
  const publisher = new FunctionPublisher((channel, payload) => broadcast(`agentos:${channel}`, payload));
  const bridge = new AgentEventBridge(manager, publisher);
  return bridge;
}

