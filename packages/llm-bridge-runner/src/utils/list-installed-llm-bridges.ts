import fs from 'fs';
import path from 'path';

/**
 * Reads the package.json in the given directory and returns dependency names
 * that appear to be LLM Bridge packages.
 */
export function listInstalledLlmBridges(baseDir = path.join(__dirname, '../../..')): string[] {
  try {
    const raw = fs.readFileSync(path.join(baseDir, 'package.json'), 'utf-8');
    const pkg = JSON.parse(raw) as { dependencies?: Record<string, string> };
    const deps = Object.keys(pkg.dependencies ?? {});
    return deps.filter((name) => name.startsWith('@llm-bridge/'));
  } catch {
    return [];
  }
}
