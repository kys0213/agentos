// scripts/remove-build-artifacts.js
const fs = require('fs');
const path = require('path');

function removeArtifacts(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      removeArtifacts(fullPath);
    } else if (
      entry.name.endsWith('.js') ||
      entry.name.endsWith('.d.ts') ||
      entry.name.endsWith('.js.map') ||
      entry.name.endsWith('.d.ts.map')
    ) {
      fs.unlinkSync(fullPath);
      console.log(`Deleted: ${fullPath}`);
    }
  }
}

// 실행 경로: 패키지 루트에서 node scripts/remove-build-artifacts.js
const srcDir = path.join(__dirname, '../src');
if (fs.existsSync(srcDir)) {
  removeArtifacts(srcDir);
} else {
  console.error('src 디렉토리가 존재하지 않습니다.');
}
