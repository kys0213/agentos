export const EXPORT_IMPORT_MESSAGES = {
  INVALID_JSON: 'Invalid agent JSON format. Please verify the contents and try again.',
  EXPORT_ERROR: 'Failed to export agent configuration.',
  IMPORT_ERROR: 'Failed to import agent configuration.',
  CLIPBOARD_ERROR: 'Copy agent JSON',
  IMPORT_SUCCESS: 'Agent configuration imported successfully.',
  EXPORT_SUCCESS: 'Agent configuration copied to clipboard.',
  IMPORT_UNAVAILABLE: 'Import is not available for this agent.',
  IMPORT_EMPTY: 'Paste exported agent JSON before importing.',
  MISSING_PRESET: 'Agent preset is missing or invalid, so export is unavailable.',
} as const;

export type ExportImportMessageKey = keyof typeof EXPORT_IMPORT_MESSAGES;
