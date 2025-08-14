const langDate = require('@agentos/lang/date');
const langFs = require('@agentos/lang/fs');

const formatted = langDate.formatDate('2024-01-01T00:00:00Z', 'yyyy-MM-dd');
if (formatted !== '2024-01-01') {
  console.error('CJS verify failed: unexpected date format', formatted);
  process.exit(1);
}

if (typeof langFs.FileUtils.exists !== 'function') {
  console.error('CJS verify failed: FileUtils.exists not found');
  process.exit(1);
}

console.log('CJS verify OK:', { formatted, hasExists: true });

