import { DESCENT_STRINGS, descentLine, descentPercent as pct } from '../../content/descent-text';
import { delveRelics, type DelveRelicId } from '../../content/delves/relics';
import { knowledgeLevels } from '../../content/knowledge';
import { ORDER_IDS } from '../../content/orders';
import { CONTRACT_SPECIES } from '../../content/remembering';
import { SKILL_IDS } from '../../content/skills';
import { num } from '../balance-access';
import type { Breakdown, Explained } from '../breakdown/breakdown';
import { levelOf } from '../investigation/knowledge';
import { skillLevel } from '../skills/skills';
import type { GameState } from '../state/game-state';

// GDD §5.15.10, §7.14 (D559, M1): What the Hold Learned. In the Descent only, the party gets one sum for
// Might and max Health (`stat%`) and a cut to damage taken (`taken%`), worked out here and nowhere else,
// with its breakdown built by the same function, so the number and its explanation cannot disagree.
// Nothing outside the Descent calls this, and the UI only prints what it returns (CLAUDE.md, D561).

/** The combat Delve relics that also work in the Descent (GDD §5.15.10, §8.10a); Bell Clapper and Horn Spoon do not. */
const ACTIVE_KINDS: readonly string[] = [
  'mightPct',
  'takenPct',
  'recoveryPoints',
  'guardianHealthPct',
];

export interface ActiveDelveRelic {
  readonly id: DelveRelicId;
  readonly name: string;
  /** The effect as GDD §8.10a words it. */
  readonly text: string;
}

export interface LearnedBonus {
  /** Added to hunter Might (`stat%`): the learned sum. */
  readonly might: Explained;
  /** Added to hunter max Health (`stat%`): the same sum. */
  readonly health: Explained;
  /** Added to damage taken (`taken%`): a cut, so negative. */
  readonly taken: Explained;
  /** The numbers the summary line prints: `+{mightPct}% … −{takenPct}%`. */
  readonly summary: { readonly mightPct: number; readonly takenPct: number };
  /** The tree: the four stat lines then the relics line; its value is the stat sum. */
  readonly breakdown: Breakdown;
  readonly relicsHeading: string;
  /** Delve relics owned that apply in the Descent; the fight applies their own effects (TD.4a). */
  readonly delveRelics: readonly ActiveDelveRelic[];
}

export const learnedBonus = (state: GameState): LearnedBonus => {
  const lines = DESCENT_STRINGS.learnedLines;
  const mastered = CONTRACT_SPECIES.filter(
    (id) => levelOf(state, id) >= knowledgeLevels.mastered.number,
  ).length;
  const properties = Object.values(state.book.properties).reduce((n, p) => n + p.length, 0);
  const skillLevels = SKILL_IDS.reduce((n, id) => n + skillLevel(state, id), 0);
  const chapters = ORDER_IDS.reduce((n, id) => n + state.orders.chaptersRead[id], 0);
  const relics = state.relics.length + state.delve.relics.length;

  const stat = (
    n: number,
    key: 'perMasteredSpecies' | 'perProperty' | 'perSkillLevel' | 'perOrderChapter',
    template: string,
    what: string,
  ): Breakdown => {
    const rate = num(`descent.learned.${key}`);
    return {
      label: descentLine(template, { p: pct(rate), m: pct(n * rate) }),
      value: n * rate,
      formula: `${n} ${what} × ${rate}`,
      key: `descent.learned.${key}`,
    };
  };
  const cutRate = num('descent.learned.takenPerRelic');
  const cut: Breakdown = {
    label: descentLine(lines.relics, { p: pct(cutRate), t: pct(relics * cutRate) }),
    value: -(relics * cutRate),
    formula: `${relics} relics × ${cutRate}`,
    key: 'descent.learned.takenPerRelic',
  };
  const statLines: Breakdown[] = [
    stat(mastered, 'perMasteredSpecies', lines.species, 'species'),
    stat(properties, 'perProperty', lines.properties, 'properties'),
    stat(skillLevels, 'perSkillLevel', lines.skills, 'levels'),
    stat(chapters, 'perOrderChapter', lines.chapters, 'chapters'),
  ];
  const sum = statLines.reduce((a, c) => a + c.value, 0);
  const owned = new Set(state.delve.relics.map((r) => r.id));
  const active = Object.values(delveRelics)
    .filter((r) => owned.has(r.id) && ACTIVE_KINDS.includes(r.effect.kind))
    .map((r) => ({ id: r.id, name: r.name, text: r.text }));

  return {
    might: {
      value: sum,
      breakdown: { label: 'Might', value: sum, children: statLines },
    },
    health: {
      value: sum,
      breakdown: { label: 'Max Health', value: sum, children: statLines },
    },
    taken: { value: cut.value, breakdown: cut },
    summary: { mightPct: pct(sum), takenPct: pct(-cut.value) },
    breakdown: { label: 'What the hold learned', value: sum, children: [...statLines, cut] },
    relicsHeading: DESCENT_STRINGS.activeRelics,
    delveRelics: active,
  };
};
