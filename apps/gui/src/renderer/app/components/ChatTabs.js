import { jsx as _jsx } from 'react/jsx-runtime';
import { Box, HStack } from '@chakra-ui/react';
const ChatTabs = ({ tabs, activeTabId, onSelect }) => {
  return _jsx(HStack, {
    borderBottom: '1px',
    borderColor: 'gray.200',
    spacing: 0,
    children: (tabs || []).map((tab) =>
      _jsx(
        Box,
        {
          px: 2,
          py: 1,
          cursor: 'pointer',
          borderBottom: activeTabId === tab.id ? '2px solid' : '2px solid transparent',
          borderColor: activeTabId === tab.id ? 'brand.500' : 'transparent',
          fontWeight: activeTabId === tab.id ? 'bold' : 'normal',
          onClick: () => onSelect(tab.id),
          children: tab.title || '(no title)',
        },
        tab.id
      )
    ),
  });
};
export default ChatTabs;
