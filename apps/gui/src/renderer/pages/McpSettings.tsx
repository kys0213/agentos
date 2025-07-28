import React from 'react';
import { Box, Button, FormControl, FormLabel, Input, Select, Stack } from '@chakra-ui/react';
import type { McpConfig } from '../types/core-types';

export interface McpSettingsProps {
  initial?: McpConfig;
  onSave(config: McpConfig): void;
}

const McpSettings: React.FC<McpSettingsProps> = ({ initial, onSave }) => {
  const [type, setType] = React.useState<McpConfig['type']>(initial?.type ?? 'stdio');
  const [name, setName] = React.useState(initial?.name ?? '');
  const [version, setVersion] = React.useState(initial?.version ?? '');

  const [command, setCommand] = React.useState(initial?.type === 'stdio' ? initial.command : '');
  const [args, setArgs] = React.useState(
    initial?.type === 'stdio' && initial.args ? initial.args.join(' ') : ''
  );
  const [url, setUrl] = React.useState(
    initial && initial.type !== 'stdio' ? (initial as any).url : ''
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let config: McpConfig;
    if (type === 'stdio') {
      config = {
        type,
        name,
        version,
        command,
        args: args ? args.split(' ') : [],
      };
    } else {
      config = {
        ...(type === 'streamableHttp' || type === 'websocket' || type === 'sse' ? { url } : {}),
        type,
        name,
        version,
      } as McpConfig;
    }
    onSave(config);
  };

  return (
    <Box as="form" onSubmit={handleSubmit} p={2}>
      <Stack spacing={2}>
        <FormControl>
          <FormLabel>Type</FormLabel>
          <Select value={type} onChange={(e) => setType(e.target.value as McpConfig['type'])}>
            <option value="stdio">stdio</option>
            <option value="streamableHttp">streamableHttp</option>
            <option value="websocket">websocket</option>
            <option value="sse">sse</option>
          </Select>
        </FormControl>
        <FormControl>
          <FormLabel>Name</FormLabel>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </FormControl>
        <FormControl>
          <FormLabel>Version</FormLabel>
          <Input value={version} onChange={(e) => setVersion(e.target.value)} />
        </FormControl>
        {type === 'stdio' && (
          <>
            <FormControl>
              <FormLabel>Command</FormLabel>
              <Input value={command} onChange={(e) => setCommand(e.target.value)} />
            </FormControl>
            <FormControl>
              <FormLabel>Args</FormLabel>
              <Input
                value={args}
                onChange={(e) => setArgs(e.target.value)}
                placeholder="--flag value"
              />
            </FormControl>
          </>
        )}
        {type !== 'stdio' && (
          <FormControl>
            <FormLabel>URL</FormLabel>
            <Input value={url} onChange={(e) => setUrl(e.target.value)} />
          </FormControl>
        )}
        <Button type="submit" colorScheme="brand" alignSelf="start">
          Save
        </Button>
      </Stack>
    </Box>
  );
};

export default McpSettings;
