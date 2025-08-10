// Re-export from Lang package for backward compatibility
import { json } from '@agentos/lang';

/**
 * @deprecated Use json.safeJsonParse or json.parseJsonWithFallback from @agentos/lang for better error handling
 */
export const parseJson = json.parseJson;
