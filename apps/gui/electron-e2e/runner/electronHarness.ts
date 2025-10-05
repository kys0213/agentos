import { _electron as electron, ElectronApplication, Page, ConsoleMessage } from 'playwright';
import path from 'node:path';
import { mkdirSync } from 'node:fs';

export interface ElectronHarness {
  app: ElectronApplication;
  window: Page;
}

export interface LaunchOptions {
  onConsole?: (message: ConsoleMessage) => void;
}

function ensureProfileDirectory(): string | undefined {
  const profileRoot = process.env.ELECTRON_TEST_PROFILE;
  if (!profileRoot) {
    return undefined;
  }
  mkdirSync(profileRoot, { recursive: true });
  return profileRoot;
}

export async function launchElectronHarness(options: LaunchOptions = {}): Promise<ElectronHarness> {
  const profile = ensureProfileDirectory();

  const env = {
    NODE_ENV: process.env.NODE_ENV ?? 'test',
    ELECTRON_DISABLE_SECURITY_WARNINGS: 'true',
    ...process.env,
  } as Record<string, string>;

  if (profile) {
    env.ELECTRON_TEST_PROFILE = profile;
  }

  const app = await electron.launch({
    args: [path.resolve(__dirname, '../../dist/main/main.js')],
    env,
    timeout: 60_000,
  });

  const window = await app.firstWindow();

  const verboseConsole = process.env.PW_ELECTRON_LOG_CONSOLE === 'true';
  window.on('console', (message) => {
    if (message.type() === 'error') {
      console.error(`[electron] console error: ${message.text()}`);
    } else if (verboseConsole) {
      console.log(`[electron:${message.type()}] ${message.text()}`);
    }
  });

  if (options.onConsole) {
    window.on('console', options.onConsole);
  }

  await window.waitForLoadState('domcontentloaded');
  try {
    await window.waitForFunction(() => document.body.dataset.appReady === 'true', undefined, {
      timeout: 60_000,
    });
  } catch (error) {
    const state = await window.evaluate(() => document.body.dataset.appReady ?? 'undefined');
    console.error(`[electron] App ready signal not received. Current state: ${state}`);
    throw error;
  }

  return { app, window };
}

export async function closeElectronHarness(harness: ElectronHarness): Promise<void> {
  await harness.app.close();
}
