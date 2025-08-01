import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';
import { Box, Button, List, ListItem, Text } from '@chakra-ui/react';
const McpList = ({ mcps, onClose }) => {
  return _jsxs(Box, {
    p: 2,
    children: [
      _jsx(Button, { mb: 2, size: 'sm', onClick: onClose, children: 'Close' }),
      mcps.length === 0
        ? _jsx(Text, { children: 'No MCPs configured.' })
        : _jsx(List, {
            spacing: 1,
            styleType: 'disc',
            pl: 4,
            children: mcps.map((mcp, idx) =>
              _jsxs(
                ListItem,
                { children: [_jsx('strong', { children: mcp.name }), ' (', mcp.type, ')'] },
                idx
              )
            ),
          }),
    ],
  });
};
export default McpList;
