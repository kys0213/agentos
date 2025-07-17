import React from 'react';
import { Box, Button, Stack, Text } from '@chakra-ui/react';
import { ChatSessionDescription } from '@agentos/core';

interface ChatSidebarProps {
  sessions: ChatSessionDescription[];
  currentSessionId?: string;
  onNew: () => void;
  onOpen: (id: string) => void;
  onShowMcps: () => void;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({
  sessions,
  currentSessionId,
  onNew,
  onOpen,
  onShowMcps,
}) => {
  return (
    <Box
      w={{ base: '100%', md: '250px' }}
      borderRight={{ base: 'none', md: '1px solid' }}
      borderBottom={{ base: '1px solid', md: 'none' }}
      borderColor="gray.200"
      p="8px"
    >
      <Stack spacing={2}>
        <Button size="sm" onClick={onNew} colorScheme="brand">
          New Chat
        </Button>
        <Button size="sm" onClick={onShowMcps}>
          MCPs
        </Button>
        <Stack spacing={2} mt={2}>
          {sessions.map((s) => (
            <Box
              key={s.id}
              cursor="pointer"
              fontWeight={currentSessionId === s.id ? 'bold' : 'normal'}
              onClick={() => onOpen(s.id)}
            >
              <Text>{s.title || '(no title)'}</Text>
              <Text fontSize="xs" color="gray.600">
                {s.id}
              </Text>
              <Text fontSize="xs" color="gray.600">
                {s.updatedAt.toLocaleString()}
              </Text>
            </Box>
          ))}
        </Stack>
      </Stack>
    </Box>
  );
};

export default ChatSidebar;
