import React from 'react';
import { Box, HStack } from '@chakra-ui/react';

export interface ChatTab {
  id: string;
  title: string;
}

export interface ChatTabsProps {
  tabs: ChatTab[];
  activeTabId?: string;
  onSelect: (id: string) => void;
}

const ChatTabs: React.FC<ChatTabsProps> = ({ tabs, activeTabId, onSelect }) => {
  return (
    <HStack borderBottom="1px" borderColor="gray.200" spacing={0}>
      {Array.isArray(tabs)
        ? tabs.map((tab) => (
            <Box
              key={tab.id}
              px={2}
              py={1}
              cursor="pointer"
              borderBottom={activeTabId === tab.id ? '2px solid' : '2px solid transparent'}
              borderColor={activeTabId === tab.id ? 'brand.500' : 'transparent'}
              fontWeight={activeTabId === tab.id ? 'bold' : 'normal'}
              onClick={() => onSelect(tab.id)}
            >
              {tab.title || '(no title)'}
            </Box>
          ))
        : []}
    </HStack>
  );
};

export default ChatTabs;
