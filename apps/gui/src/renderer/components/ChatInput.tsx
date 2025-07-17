import React, { useState } from 'react';
import { Button, HStack, Input } from '@chakra-ui/react';

export interface ChatInputProps {
  onSend(text: string): void;
  disabled?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSend, disabled }) => {
  const [input, setInput] = useState('');

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setInput('');
  };

  return (
    <HStack>
      <Input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            handleSend();
          }
        }}
        placeholder="Type a message"
        isDisabled={disabled}
      />
      <Button onClick={handleSend} isDisabled={disabled} colorScheme="brand">
        Send
      </Button>
    </HStack>
  );
};

export default ChatInput;
