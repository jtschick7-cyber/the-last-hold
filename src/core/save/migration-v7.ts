import type { Migration } from './migrations';

type Plain = Record<string, unknown>;

const asPlain = (v: unknown): Plain => (typeof v === 'object' && v !== null ? (v as Plain) : {});
const list = (v: unknown): Plain[] => (Array.isArray(v) ? (v as Plain[]) : []);

// v6 → v7 (plan T7.1, D267): the v0.7 additions to the save. So far: each act records the
// contracts won against each monster family, which Act IV's margins count (D245). Acts
// already begun start at none: the count is "since the act began", and a save has never
// recorded a family. T7.5 adds the Delve state to this same step.
export const v6ToV7: Migration = (state) => {
  const s: Plain = structuredClone(state);
  const story = asPlain(s.story);
  return {
    ...s,
    story: {
      ...story,
      acts: list(story.acts).map((a) => ({ ...a, winsByFamily: {} })),
    },
  };
};
