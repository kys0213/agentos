export interface ChatMessage {
  id: number;
  type: 'user' | 'agent' | 'system' | 'reasoning';
  content: string;
  timestamp: string;
  agentName?: string;
  agentPreset?: string;
  agentId?: string;
  reasoningSteps?: ReasoningStep[];
}

export interface ReasoningStep {
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
  preset: string;
  status: 'active' | 'idle';
  description: string;
  icon: string;
  keywords: string[];
}

export interface ActiveAgent {
  id: string;
  name: string;
  preset: string;
  status: string;
  description: string;
  icon: string;
}

export interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
  category: string;
}

export interface AppModeState {
  mode: 'chat' | 'management';
  activeSection: 'dashboard' | 'presets' | 'subagents' | 'models' | 'tools' | 'racp' | 'settings';
}
