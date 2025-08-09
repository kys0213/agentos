import type { AppSection } from './design-types';
import type { ChatSessionMetadata, MessageHistory } from '@agentos/core';

// Re-export core types
export type { ChatSessionMetadata, MessageHistory };

export interface QuickAction {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  description: string;
  category: 'chat' | 'management' | 'settings' | 'navigation';
}

// 앱 모드 상태 관리 - 새 디자인과 호환되도록 확장
export interface AppModeState {
  mode: 'chat' | 'management';
  activeSection: AppSection; // design-types의 AppSection 사용
}
