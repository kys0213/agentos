export interface QuickAction {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  description: string;
  category: 'chat' | 'management' | 'settings' | 'navigation';
}

export interface AppModeState {
  mode: 'chat' | 'management';
  activeSection:
    | 'chat'
    | 'dashboard'
    | 'presets'
    | 'subagents'
    | 'models'
    | 'tools'
    | 'racp'
    | 'settings';
}
