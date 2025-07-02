import fs from 'fs';
import path from 'path';
import { listInstalledLlmBridges } from '../list-installed-llm-bridges';

test('listInstalledLlmBridges reads dependencies', () => {
  const dir = fs.mkdtempSync(path.join(__dirname, 'pkg-'));
  fs.writeFileSync(
    path.join(dir, 'package.json'),
    JSON.stringify({ dependencies: { '@llm-bridge/a': '1.0.0', other: '1.0.0' } })
  );
  const result = listInstalledLlmBridges(dir);
  expect(result).toEqual(['@llm-bridge/a']);
  fs.rmSync(dir, { recursive: true, force: true });
});
