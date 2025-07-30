import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Box, Button, HStack, Input, Select, Text, VStack } from '@chakra-ui/react';
import EchoBridge from '../bridges/EchoBridge';
import ReverseBridge from '../bridges/ReverseBridge';
const LlmBridgeManager = ({ store, manager, onChange }) => {
    const [bridges, setBridges] = useState([]);
    const [id, setId] = useState('');
    const [type, setType] = useState('echo');
    useEffect(() => {
        setBridges(store.list());
    }, [store]);
    const handleAdd = () => {
        if (!id)
            return;
        const config = { id, type };
        store.save(config);
        const BridgeCtor = type === 'echo' ? EchoBridge : ReverseBridge;
        manager.register(id, new BridgeCtor());
        setBridges(store.list());
        setId('');
        onChange && onChange();
    };
    const handleDelete = (bridgeId) => {
        store.delete(bridgeId);
        setBridges(store.list());
        onChange && onChange();
    };
    return (_jsxs(Box, { p: 2, children: [_jsx(Text, { fontWeight: "bold", mb: 2, children: "LLM Bridges" }), _jsx(VStack, { align: "start", spacing: 2, as: "ul", listStyleType: "disc", pl: 4, children: bridges.map((b) => (_jsxs(HStack, { as: "li", spacing: 2, children: [_jsxs(Text, { children: [b.id, " (", b.type, ")"] }), _jsx(Button, { size: "xs", onClick: () => handleDelete(b.id), children: "Delete" })] }, b.id))) }), _jsxs(HStack, { mt: 2, spacing: 2, children: [_jsx(Input, { value: id, onChange: (e) => setId(e.target.value), placeholder: "Bridge id", size: "sm" }), _jsxs(Select, { value: type, onChange: (e) => setType(e.target.value), size: "sm", w: "auto", children: [_jsx("option", { value: "echo", children: "echo" }), _jsx("option", { value: "reverse", children: "reverse" })] }), _jsx(Button, { size: "sm", onClick: handleAdd, colorScheme: "brand", children: "Add" })] })] }));
};
export default LlmBridgeManager;
