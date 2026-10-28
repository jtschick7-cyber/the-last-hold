// Technical design §5.2 (v11, D452, D461, D466): everything the ending keeps. The gate, the card's
// form and the Order cards are derived from the rest of the state, never stored.
// v14 (D562): 'descent' is the third ending, recorded only by a won Descent (never by a choice).
export const ENDING_IDS = ['remember', 'vigil', 'descent'] as const;
export type EndingId = (typeof ENDING_IDS)[number];

export interface EndingRecord {
  ending: EndingId;
  /** Information only; never compared, so a clock set back breaks nothing (D461 (2)). */
  at: number;
  /** The cycle number when it was chosen. */
  cycle: number;
}

export interface RememberingState {
  /** Pechko's near-scene (R-01 or R-02) was closed with Continue (D461 (4)). */
  nearSeen: boolean;
  /** The "The Remembering is ready" line has been shown (D466 (1)). */
  readyNoted: boolean;
  /** Endings reached, in the order chosen (array order, not time); at most one of each. */
  endings: EndingRecord[];
}

export const newRememberingState = (): RememberingState => ({
  nearSeen: false,
  readyNoted: false,
  endings: [],
});
