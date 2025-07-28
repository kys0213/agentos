import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Button, Stack, Text } from '@chakra-ui/react';
const ChatSidebar = ({ sessions, currentSessionId, onNew, onOpen, onShowMcps, }) => {
    return (_jsx(Box, { w: { base: '100%', md: '250px' }, borderRight: { base: 'none', md: '1px solid' }, borderBottom: { base: '1px solid', md: 'none' }, borderColor: "gray.200", p: "8px", children: _jsxs(Stack, { spacing: 2, children: [_jsx(Button, { size: "sm", onClick: onNew, colorScheme: "brand", children: "New Chat" }), _jsx(Button, { size: "sm", onClick: onShowMcps, children: "MCPs" }), _jsx(Stack, { spacing: 2, mt: 2, children: sessions.map((s) => (_jsxs(Box, { cursor: "pointer", fontWeight: currentSessionId === s.id ? 'bold' : 'normal', onClick: () => onOpen(s.id), children: [_jsx(Text, { children: s.title || '(no title)' }), _jsx(Text, { fontSize: "xs", color: "gray.600", children: s.id }), _jsx(Text, { fontSize: "xs", color: "gray.600", children: s.updatedAt.toLocaleString() })] }, s.id))) })] }) }));
};
export default ChatSidebar;
