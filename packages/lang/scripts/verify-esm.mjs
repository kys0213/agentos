import { formatDate } from '@agentos/lang/date';
import { FileUtils } from '@agentos/lang/fs';

const formatted = formatDate('2024-01-01T00:00:00Z', 'yyyy-MM-dd');
if (formatted !== '2024-01-01') {
  console.error('ESM verify failed: unexpected date format', formatted);
  process.exit(1);
}

if (typeof FileUtils.exists !== 'function') {
  console.error('ESM verify failed: FileUtils.exists not found');
  process.exit(1);
}

console.log('ESM verify OK:', { formatted, hasExists: true });

