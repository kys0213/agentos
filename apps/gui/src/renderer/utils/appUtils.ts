import type { AppSection } from '../stores/store-types';

/**
 * Get page title based on current navigation state
 * Utility function for determining the header title in management mode
 */
export const getPageTitle = (
  creatingMCPTool: boolean,
  creatingAgent: boolean,
  creatingCustomTool: boolean,
  activeSection: AppSection
): string => {
  if (creatingMCPTool) {
    return 'Create MCP Tool';
  }

  if (creatingAgent) {
    return 'Create Agent';
  }

  if (creatingCustomTool) {
    return 'Create Custom Tool';
  }

  switch (activeSection) {
    case 'dashboard':
      return 'Dashboard';
    case 'subagents':
      return 'Agents';
    case 'models':
      return 'Models';
    case 'tools':
      return 'Tools';
    case 'toolbuilder':
      return 'Tool Builder';
    case 'racp':
      return 'RACP';
    case 'settings':
      return 'Settings';
    case 'chat':
      return 'Chat';
    default:
      return '';
}
};
