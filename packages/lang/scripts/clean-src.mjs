import fs from 'node:fs';
import path from 'node:path';

const SRC = path.resolve(process.cwd(), 'src');
const EXTENSIONS = ['.js', '.d.ts', '.js.map', '.d.ts.map'];

function removeCompiledFiles(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      removeCompiledFiles(p);
    } else if (entry.isFile()) {
      if (EXTENSIONS.some((ext) => p.endsWith(ext))) {
        try {
          fs.rmSync(p);
        } catch {}
      }
    }
  }
}

if (fs.existsSync(SRC)) {
  removeCompiledFiles(SRC);
}

