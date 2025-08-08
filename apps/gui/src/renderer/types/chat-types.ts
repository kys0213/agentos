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

// GUI 특화 채팅 관련 타입들
// MessageHistory는 타입 앨리어스이므로 intersection으로 확장
export type GuiMessage = MessageHistory & {
  // GUI에서 필요한 추가 필드들을 여기에 정의
  // isCompressed는 이미 MessageHistory에 있음
  // 예: 메시지 표시 상태나 UI 관련 메타데이터
  isHighlighted?: boolean;
  isSelected?: boolean;
};

export interface GuiChatSession extends ChatSessionMetadata {
  // GUI에서 필요한 추가 필드들
  isPinned?: boolean;
  lastViewedAt?: Date;
  // 예: GUI 레벨의 세션 관리 메타데이터
}
