import React, { useEffect, useRef } from 'react';
import { Box, Text, VStack } from '@chakra-ui/react';

export interface Message {
  sender: 'user' | 'agent';
  text: string;
}

export interface ChatMessageListProps {
  messages: Message[];
}

const ChatMessageList: React.FC<ChatMessageListProps> = ({ messages }) => {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <Box h="400px" overflowY="auto" border="1px solid" borderColor="gray.200" p="8px">
      <VStack align="start" spacing={2}>
        {messages.map((m, idx) => (
          <Text key={idx}>
            <strong>{m.sender === 'user' ? 'You' : 'Agent'}:</strong> {m.text}
          </Text>
        ))}
        <Box ref={endRef} />
      </VStack>
    </Box>
  );
};

export default ChatMessageList;
