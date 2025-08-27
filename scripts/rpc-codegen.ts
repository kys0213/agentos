/*
  RPC Codegen (Phase A skeleton)

  - Input: apps/gui/src/shared/rpc/contracts/*.contract.ts (TS+Zod contracts)
  - Output:
    - apps/gui/src/renderer/rpc/gen/<ns>.client.ts
    - apps/gui/src/main/<ns>/gen/<ns>.controller.ts (stub)
    - apps/gui/src/shared/rpc/gen/channels.ts

  This is a scaffold. It prints discovered contracts and planned outputs.
  A follow-up will implement AST parsing and template emission via ts-morph.
*/

import fs from 'node:fs';
import path from 'node:path';

function findContractFiles(root: string): string[] {
  const files: string[] = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const p = path.join(root, entry.name);
    if (entry.isDirectory()) {
      files.push(...findContractFiles(p));
    } else if (entry.isFile() && entry.name.endsWith('.contract.ts')) {
      files.push(p);
    }
  }
  return files.sort();
}

function main() {
  const repoRoot = path.resolve(__dirname, '..');
  const contractsRoot = path.resolve(repoRoot, 'apps/gui/src/shared/rpc/contracts');
  if (!fs.existsSync(contractsRoot)) {
    console.error('No contracts folder:', contractsRoot);
    process.exit(0);
  }

  const contracts = findContractFiles(contractsRoot);
  console.log('[rpc-codegen] Found contracts:', contracts.length);
  for (const f of contracts) {
    console.log(' -', path.relative(repoRoot, f));
  }

  console.log('[rpc-codegen] This is a skeleton. Implement ts-morph parsing and emission next.');
}

main();

