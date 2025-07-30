import React from 'react';
import { Box, Button, List, ListItem, Text } from '@chakra-ui/react';
import type { McpConfig } from '../types/core-types';

export interface McpListProps {
  mcps: McpConfig[];
  onClose(): void;
}

const McpList: React.FC<McpListProps> = ({ mcps, onClose }) => {
  return (
    <Box p={2}>
      <Button mb={2} size="sm" onClick={onClose}>
        Close
      </Button>
      {mcps.length === 0 ? (
        <Text>No MCPs configured.</Text>
      ) : (
        <List spacing={1} styleType="disc" pl={4}>
          {mcps.map((mcp, idx) => (
            <ListItem key={idx}>
              <strong>{mcp.name}</strong> ({mcp.type})
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
};

export default McpList;
