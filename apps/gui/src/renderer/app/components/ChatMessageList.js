import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';
import { useEffect, useRef } from 'react';
import { Box, HStack, Spinner, Text, VStack } from '@chakra-ui/react';
const ChatMessageList = ({ messages, loading }) => {
  const endRef = useRef(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  return _jsx(Box, {
    flex: '1',
    overflowY: 'auto',
    border: '1px solid',
    borderColor: 'gray.200',
    p: '8px',
    children: _jsxs(VStack, {
      align: 'stretch',
      spacing: 2,
      children: [
        (messages || []).map((m, idx) =>
          _jsxs(
            Box,
            {
              alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
              bg: m.sender === 'user' ? 'blue.100' : 'gray.100',
              borderRadius: 'md',
              p: 2,
              maxW: '80%',
              children: [
                _jsx(Text, { children: m.text }),
                _jsx(Text, {
                  fontSize: 'xs',
                  color: 'gray.500',
                  textAlign: 'right',
                  children: m.timestamp.toLocaleTimeString(),
                }),
              ],
            },
            idx
          )
        ),
        loading &&
          _jsxs(HStack, {
            alignSelf: 'flex-start',
            spacing: 2,
            children: [
              _jsx(Spinner, { size: 'sm' }),
              _jsx(Text, { fontSize: 'sm', children: '\uB2F5\uBCC0 \uC0DD\uC131 \uC911...' }),
            ],
          }),
        _jsx(Box, { ref: endRef }),
      ],
    }),
  });
};
export default ChatMessageList;
