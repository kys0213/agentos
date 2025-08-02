import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';
import { useState } from 'react';
import { Button, HStack, Input } from '@chakra-ui/react';
const ChatInput = ({ onSend, disabled }) => {
  const [input, setInput] = useState('');
  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setInput('');
  };
  return _jsxs(HStack, {
    children: [
      _jsx(Input, {
        value: input,
        onChange: (e) => setInput(e.target.value),
        onKeyDown: (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            handleSend();
          }
        },
        placeholder: 'Type a message',
        isDisabled: disabled,
      }),
      _jsx(Button, {
        onClick: handleSend,
        isDisabled: disabled,
        colorScheme: 'brand',
        children: 'Send',
      }),
    ],
  });
};
export default ChatInput;
