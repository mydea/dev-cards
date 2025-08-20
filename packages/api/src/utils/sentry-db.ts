import * as Sentry from '@sentry/cloudflare';
import { Database } from '../db/queries.js';

/**
 * Creates an instrumented database instance with Sentry monitoring
 */
export function createInstrumentedDatabase(d1: D1Database): Database {
  const instrumentedD1 = Sentry.instrumentD1WithSentry(d1);
  return new Database(instrumentedD1);
}
