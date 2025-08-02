import React from 'react';
import { Box, Input } from '@chakra-ui/react';
import { useChatSessions, useSendMessage } from '../../hooks/queries/use-chat-sessions';
import { useChatState, useChatActions } from '../../stores/app-store';
import ChatTabs from '../ChatTabs';
import ChatMessageList from '../ChatMessageList';
import ChatInput from '../ChatInput';
import useChatSession from '../../hooks/useChatSession';
import useMessageSearch from '../../hooks/useMessageSearch';
import { Services } from '../../bootstrap';

/**
 * 채팅 컨테이너 컴포넌트
 * - 채팅 관련 모든 로직과 UI 관리
 * - 탭, 메시지 리스트, 입력, 검색 포함
 * - ChatApp.tsx에서 채팅 관련 로직 분리
 */
const ChatContainer: React.FC = () => {
  const chatState = useChatState();
  const chatActions = useChatActions();

  // React Query 데이터
  const { data: sessions = [], refetch: refetchSessions } = useChatSessions();
  const sendMessageMutation = useSendMessage();

  // 기존 훅 (점진적 마이그레이션)
  const { sessionId, messages, openSession, send } = useChatSession(Services.getChat());
  const filteredMessages = useMessageSearch(messages, chatState.searchTerm);

  // 세션 열기 핸들러
  const handleOpenSession = React.useCallback(
    async (id: string) => {
      await openSession(id);
      chatActions.addTab(id);
    },
    [openSession, chatActions]
  );

  // 메시지 전송 핸들러
  const handleSend = async (text: string) => {
    if (!sessionId) return;

    try {
      chatActions.setBusy(true);
      await send(text);
      refetchSessions();
    } catch (error) {
      console.error('Error:', error);
    } finally {
      chatActions.setBusy(false);
    }
  };

  return (
    <Box p={2} display="flex" flexDirection="column" h="100%">
      {/* 채팅 탭 */}
      <ChatTabs
        tabs={chatState.openTabIds.map((id) => ({
          id,
          title: sessions.find((s) => s.id === id)?.title || id,
        }))}
        activeTabId={chatState.activeSessionId || ''}
        onSelect={handleOpenSession}
      />

      {/* 메시지 검색 */}
      <Input
        placeholder="Search messages"
        value={chatState.searchTerm}
        onChange={(e) => chatActions.setSearchTerm(e.target.value)}
        mb={2}
        size="sm"
      />

      {/* 메시지 리스트 */}
      <ChatMessageList
        messages={filteredMessages}
        loading={chatState.busy || sendMessageMutation.isPending}
      />

      {/* 채팅 입력 */}
      <ChatInput onSend={handleSend} disabled={chatState.busy || sendMessageMutation.isPending} />
    </Box>
  );
};

export default ChatContainer;
