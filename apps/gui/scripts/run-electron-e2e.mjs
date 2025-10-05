import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const args = process.argv.slice(2).filter((arg) => arg !== '--');

function run(command, commandArgs, options = {}) {
  const result = spawnSync(command, commandArgs, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    ...options,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

run('pnpm', ['--filter', 'e2e-llm-bridge', 'build']);
run('pnpm', ['run', 'compile']);
run('pnpm', ['run', 'build:dev']);

const profileDir = mkdtempSync(path.join(tmpdir(), 'agentos-electron-e2e-'));
const preserveProfile = process.env.PRESERVE_E2E_PROFILE === 'true';
if (preserveProfile) {
  console.log(`[run-electron-e2e] Preserving profile is enabled. Directory: ${profileDir}`);
}

const mode = process.env.E2E_MOCK === 'true' ? 'mock' : 'full';
run('node', ['dist/main/__tests__/seed-backend.cli.js', '--profile', profileDir, '--mode', mode]);

try {
  const env = {
    ...process.env,
    ELECTRON_TEST_PROFILE: profileDir,
    NODE_ENV: process.env.NODE_ENV ?? 'development',
  };
  run('pnpm', ['exec', 'playwright', 'test', '--config=playwright.config.ts', ...args], { env });
} finally {
  if (preserveProfile) {
    console.log(`[run-electron-e2e] Preserving profile directory: ${profileDir}`);
  } else {
    rmSync(profileDir, { recursive: true, force: true });
  }
}
