import React, { useEffect, useRef } from 'react';
import { Box, HStack, Spinner, Text, VStack } from '@chakra-ui/react';

export interface Message {
  sender: 'user' | 'agent';
  text: string;
  timestamp: Date;
}

export interface ChatMessageListProps {
  messages: Message[];
  loading?: boolean;
}

const ChatMessageList: React.FC<ChatMessageListProps> = ({ messages, loading }) => {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <Box flex="1" overflowY="auto" border="1px solid" borderColor="gray.200" p="8px">
      <VStack align="stretch" spacing={2}>
        {Array.isArray(messages)
          ? messages.map((m, idx) => (
              <Box
                key={idx}
                alignSelf={m.sender === 'user' ? 'flex-end' : 'flex-start'}
                bg={m.sender === 'user' ? 'blue.100' : 'gray.100'}
                borderRadius="md"
                p={2}
                maxW="80%"
              >
                <Text>{m.text}</Text>
                <Text fontSize="xs" color="gray.500" textAlign="right">
                  {m.timestamp.toLocaleTimeString()}
                </Text>
              </Box>
            ))
          : []}
        {loading && (
          <HStack alignSelf="flex-start" spacing={2}>
            <Spinner size="sm" />
            <Text fontSize="sm">답변 생성 중...</Text>
          </HStack>
        )}
        <Box ref={endRef} />
      </VStack>
    </Box>
  );
};

export default ChatMessageList;
