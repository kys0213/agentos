import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React from 'react';
import { Box, Button, FormControl, FormLabel, Input, Select, Stack } from '@chakra-ui/react';
const McpSettings = ({ initial, onSave }) => {
    const [type, setType] = React.useState(initial?.type ?? 'stdio');
    const [name, setName] = React.useState(initial?.name ?? '');
    const [version, setVersion] = React.useState(initial?.version ?? '');
    const [command, setCommand] = React.useState(initial?.type === 'stdio' ? initial.command : '');
    const [args, setArgs] = React.useState(initial?.type === 'stdio' && initial.args ? initial.args.join(' ') : '');
    const [url, setUrl] = React.useState(initial && initial.type !== 'stdio' ? initial.url : '');
    const handleSubmit = (e) => {
        e.preventDefault();
        let config;
        if (type === 'stdio') {
            config = {
                type,
                name,
                version,
                command,
                args: args ? args.split(' ') : [],
            };
        }
        else {
            config = {
                ...(type === 'streamableHttp' || type === 'websocket' || type === 'sse' ? { url } : {}),
                type,
                name,
                version,
            };
        }
        onSave(config);
    };
    return (_jsx(Box, { as: "form", onSubmit: handleSubmit, p: 2, children: _jsxs(Stack, { spacing: 2, children: [_jsxs(FormControl, { children: [_jsx(FormLabel, { children: "Type" }), _jsxs(Select, { value: type, onChange: (e) => setType(e.target.value), children: [_jsx("option", { value: "stdio", children: "stdio" }), _jsx("option", { value: "streamableHttp", children: "streamableHttp" }), _jsx("option", { value: "websocket", children: "websocket" }), _jsx("option", { value: "sse", children: "sse" })] })] }), _jsxs(FormControl, { children: [_jsx(FormLabel, { children: "Name" }), _jsx(Input, { value: name, onChange: (e) => setName(e.target.value) })] }), _jsxs(FormControl, { children: [_jsx(FormLabel, { children: "Version" }), _jsx(Input, { value: version, onChange: (e) => setVersion(e.target.value) })] }), type === 'stdio' && (_jsxs(_Fragment, { children: [_jsxs(FormControl, { children: [_jsx(FormLabel, { children: "Command" }), _jsx(Input, { value: command, onChange: (e) => setCommand(e.target.value) })] }), _jsxs(FormControl, { children: [_jsx(FormLabel, { children: "Args" }), _jsx(Input, { value: args, onChange: (e) => setArgs(e.target.value), placeholder: "--flag value" })] })] })), type !== 'stdio' && (_jsxs(FormControl, { children: [_jsx(FormLabel, { children: "URL" }), _jsx(Input, { value: url, onChange: (e) => setUrl(e.target.value) })] })), _jsx(Button, { type: "submit", colorScheme: "brand", alignSelf: "start", children: "Save" })] }) }));
};
export default McpSettings;
