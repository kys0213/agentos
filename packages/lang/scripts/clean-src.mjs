import fs from 'node:fs';
import path from 'node:path';

const SRC = path.resolve(process.cwd(), 'src');
const EXT = ['.js', '.d.ts', '.js.map', '.d.ts.map'];

function clean(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) clean(p);
    else if (ent.isFile() && EXT.some((e) => p.endsWith(e))) {
      try { fs.rmSync(p); } catch {}
    }
  }
}

if (fs.existsSync(SRC)) clean(SRC);

