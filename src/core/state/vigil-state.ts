// Technical design §21.1 (v13, D543): Rising Vigil's saved state. Not to be confused with the
// ending id 'vigil' (Keep the Vigil, remembering-state.ts): that one changes nothing (D453, D539).
export interface VigilState {
  /** The switch as the player left it; kept through the Long Night. */
  on: boolean;
  /** Stands already fought with the switch On; a non-negative integer. */
  stands: number;
}

export const newVigilState = (): VigilState => ({ on: false, stands: 0 });
