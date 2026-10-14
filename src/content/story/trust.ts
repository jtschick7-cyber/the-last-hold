import type { VillageId } from '../villages';

// GDD §5.14.6 (D146, D147) and lore-secrets §24: village trust. It rises from
// contracts won (trust.stepContracts) and Triumphant stands, never drops, and
// changes no numbers in v0.5. Each village keeps its starting level from
// setting-primer §3.

export const TRUST_LEVELS = ['cold', 'wary', 'hopeful', 'trusting', 'sworn'] as const;
export type TrustLevel = (typeof TRUST_LEVELS)[number];

export const trustLevels: Readonly<
  Record<TrustLevel, { readonly label: string; readonly line: string }>
> = {
  cold: { label: 'Cold', line: 'They bar the door when your hunters pass.' },
  wary: { label: 'Wary', line: "They'll take your help and count the cost." },
  hopeful: { label: 'Hopeful', line: "They've started saving the good bread for your hunters." },
  trusting: { label: 'Trusting', line: "When something's wrong, they send for the hold first." },
  sworn: { label: 'Sworn', line: "They'd stand on the walls with you." },
};

/** setting-primer §3: each village's starting trust in the hold. */
export const startingTrust: Readonly<Record<VillageId, TrustLevel>> = {
  'dubno-ford': 'wary',
  'kozly-hollow': 'cold',
  mirograd: 'hopeful',
  velkvik: 'wary',
  ravenfell: 'cold',
};

/** lore-secrets §24: one line on the away sheet or the result sheet when a village rises. */
export const trustStepLine = (village: string, level: TrustLevel): string =>
  `${village} trusts the hold a little more: ${trustLevels[level].label}.`;

/** The Villages panel's progress line: "6 of 10 contracts toward Wary". */
export const trustProgressLine = (won: number, needed: number, next: TrustLevel): string =>
  `${won} of ${needed} contracts toward ${trustLevels[next].label}`;
