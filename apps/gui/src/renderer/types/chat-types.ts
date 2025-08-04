import type { Preset } from './core-types';

export interface ChatMessage {
  id: number;
  type: 'user' | 'agent' | 'system' | 'orchestration';
  content: string;
  timestamp: string;
  agentName?: string;
  agentPreset?: string;
  agentId?: string;
  orchestrationSteps?: OrchestrationStep[];
}

export interface OrchestrationStep {
  id: string;
  type: 'analysis' | 'keyword-matching' | 'agent-selection' | 'conclusion';
  title: string;
  content: string;
  data?: any;
  isCompleted: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
  agentName: string;
  agentPreset: string;
  messageCount: number;
  isPinned?: boolean;
  isArchived?: boolean;
}

export interface AvailableAgent {
  id: string;
  name: string;
  preset: Preset;
  status: 'active' | 'idle' | 'error';
  description: string;
  icon: string;
  keywords: string[];
}

export interface ActiveAgent {
  id: string;
  name: string;
  preset: Preset;
  status: 'active' | 'idle' | 'busy' | 'error';
  description: string;
  icon: string;
}

export interface QuickAction {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  description: string;
  category: 'chat' | 'management' | 'settings' | 'navigation';
}

export interface AppModeState {
  mode: 'chat' | 'management';
  activeSection: 'dashboard' | 'presets' | 'subagents' | 'models' | 'tools' | 'racp' | 'settings';
}
