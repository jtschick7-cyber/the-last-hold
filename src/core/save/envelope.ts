import { RULES_VERSION } from '../rules-version';
import { SCHEMA_VERSION, type GameState } from '../state/game-state';

// Technical design §9.2: every save, stored or exported, is this envelope.
export const APP_ID = 'the-last-hold';

export interface SaveEnvelope {
  app: typeof APP_ID;
  schemaVersion: number;
  rulesVersion: number;
  savedAt: number;
  state: GameState;
}

export const makeEnvelope = (state: GameState, now: number): SaveEnvelope => ({
  app: APP_ID,
  schemaVersion: SCHEMA_VERSION,
  rulesVersion: RULES_VERSION,
  savedAt: now,
  state: structuredClone(state),
});
