import { failure, success, type Result } from '../result';
import { SCHEMA_VERSION } from '../state/game-state';
import { APP_ID } from './envelope';
import { migrate } from './migrations';
import { validateState, type Validated } from './validate';

// Technical design §9.3–9.4: after a code or file is unpacked, every load runs
// the same steps: the envelope, the version, migration, then validation.
export const loadEnvelope = (json: unknown): Result<Validated> => {
  if (typeof json !== 'object' || json === null) return failure("This isn't a Last Hold save.");
  const env = json as Record<string, unknown>;
  if (env.app !== APP_ID) return failure("This isn't a Last Hold save.");
  const version = env.schemaVersion;
  if (typeof version !== 'number') return failure("This save's version number is missing.");
  const migrated = migrate(env.state, version);
  if (!migrated.ok) return migrated;
  const valid = validateState(migrated.value);
  if (!valid.ok) return valid;
  valid.value.state.meta.schemaVersion = SCHEMA_VERSION;
  return success(valid.value);
};
