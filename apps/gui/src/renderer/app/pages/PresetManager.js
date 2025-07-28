import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Box, Button, Input, List, ListItem, Text, VStack } from '@chakra-ui/react';
import { PresetStore, loadPresets, savePreset, deletePreset } from '../stores/preset-store';
const store = new PresetStore();
const emptyPreset = () => ({
    id: Date.now().toString(),
    name: '',
    description: '',
    author: '',
    createdAt: new Date(),
    updatedAt: new Date(),
    version: '1.0.0',
    systemPrompt: '',
    enabledMcps: [],
    llmBridgeName: '',
    llmBridgeConfig: {},
});
const PresetManager = () => {
    const [presets, setPresets] = useState([]);
    const [current, setCurrent] = useState(emptyPreset());
    useEffect(() => {
        loadPresets(store).then(setPresets);
    }, []);
    const handleSave = async () => {
        await savePreset(store, { ...current, updatedAt: new Date() });
        setCurrent(emptyPreset());
        setPresets(await loadPresets(store));
    };
    const handleDelete = async (id) => {
        await deletePreset(store, id);
        setPresets(await loadPresets(store));
    };
    return (_jsxs(Box, { p: 2, children: [_jsx(Text, { fontWeight: "bold", mb: 2, children: "Presets" }), _jsx(List, { spacing: 1, styleType: "disc", pl: 4, children: presets.map((p) => (_jsxs(ListItem, { children: [p.name, ' ', _jsx(Button, { size: "xs", onClick: () => handleDelete(p.id), children: "Delete" })] }, p.id))) }), _jsxs(VStack, { mt: 2, spacing: 2, align: "start", children: [_jsx(Input, { value: current.name, onChange: (e) => setCurrent({ ...current, name: e.target.value }), placeholder: "Preset name", size: "sm" }), _jsx(Button, { size: "sm", onClick: handleSave, colorScheme: "brand", children: "Add" })] })] }));
};
export default PresetManager;
