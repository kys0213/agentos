// Re-export from Lang package for backward compatibility
import { parseJson as parseJsonCore } from '@agentos/lang/json';

/**
 * @deprecated Use parseJson or parseJsonWithFallback from @agentos/lang/json for better error handling
 */
export const parseJson = parseJsonCore;
