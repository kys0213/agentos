import { AppSection } from '../types';

export const getPageTitle = (
  creatingPreset: boolean,
  creatingMCPTool: boolean,
  creatingAgent: boolean,
  creatingCustomTool: boolean,
  selectedPreset: any,
  activeSection: AppSection
): string => {
  if (creatingPreset) {
    return 'Create Preset';
  }

  if (creatingMCPTool) {
    return 'Create MCP Tool';
  }

  if (creatingAgent) {
    return 'Create Agent';
  }

  if (creatingCustomTool) {
    return 'Create Custom Tool';
  }

  if (selectedPreset) {
    return selectedPreset.name;
  }

  switch (activeSection) {
    case 'dashboard':
      return 'Dashboard';
    case 'presets':
      return 'Presets';
    case 'subagents':
      return 'Sub Agents';
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
    default:
      return '';
  }
};
