import type { BlessingEffect } from '../../content/delves/blessing-types';
import { blessingById } from '../../content/delves/blessings';
import type { Breakdown } from '../breakdown/breakdown';

// GDD §9.15 (D257): "Your blessings" lists every blessing taken with its breakdown. The effects
// are the same data combat reads, so the list can't disagree with the fight; the Unlit's
// drawbacks appear as negative lines (and as a red "but…" on the card).

const pct = (x: number): string => `${Math.round(Math.abs(x) * 1000) / 10}%`;
const sign = (x: number): string => (x < 0 ? '−' : '+');

/** One effect as a signed line: the label the player reads and the number behind it. */
export const effectLine = (e: BlessingEffect): Breakdown => {
  const line = (label: string, value: number, text: string): Breakdown => ({
    label: `${text} ${label}`.trim(),
    value,
  });
  switch (e.kind) {
    case 'mightPct':
      return line('Might', e.amount, `${sign(e.amount)}${pct(e.amount)}`);
    case 'mightPerWeaponTier':
      return line('Might per weapon tier', e.amount, `${sign(e.amount)}${e.amount}`);
    case 'mightPctPerRole':
      return line('Might per different role', e.amount, `${sign(e.amount)}${pct(e.amount)}`);
    case 'mightPctBelowHealth':
      return line(
        `Might below ${pct(e.below)} Health`,
        e.amount,
        `${sign(e.amount)}${pct(e.amount)}`,
      );
    case 'armorFlat':
      return line('Armor', e.amount, `${sign(e.amount)}${Math.abs(e.amount)}`);
    case 'armorPerArmorTier':
      return line('Armor per armor tier', e.amount, `${sign(e.amount)}${e.amount}`);
    case 'healthPct':
      return line('max Health', e.amount, `${sign(e.amount)}${pct(e.amount)}`);
    case 'speedFlat':
      return line('Speed', e.amount, `${sign(e.amount)}${Math.abs(e.amount)}`);
    case 'speedPerRole':
      return line('Speed per different role', e.amount, `${sign(e.amount)}${e.amount}`);
    case 'dealtPct':
      return line(
        e.minWeaponTier ? 'damage dealt (weapon tier 2 or more)' : 'damage dealt',
        e.amount,
        `${sign(e.amount)}${pct(e.amount)}`,
      );
    case 'dealtPctPerDamageType':
      return line(
        'damage dealt per different damage type',
        e.amount,
        `${sign(e.amount)}${pct(e.amount)}`,
      );
    case 'takenPct':
      return line(
        e.types ? `${e.types.join(' and ')} damage taken` : 'damage taken',
        -e.amount,
        `${e.amount < 0 ? '+' : '−'}${pct(e.amount)}`,
      );
    case 'takenPctPerRole':
      return line('damage taken per different role', -e.amount, `−${pct(e.amount)}`);
    case 'takenPctOthersWhileVanguard':
      return line(
        'damage taken for the others while a Vanguard stands',
        -e.amount,
        `−${pct(e.amount)}`,
      );
    case 'healPct':
      return line("on the Mender's heals", e.amount, `${sign(e.amount)}${pct(e.amount)}`);
    case 'menderThreshold':
      return line('the Mender heals anyone below', e.value, pct(e.value));
    case 'critPoints':
      return line('points crit chance', e.amount, `${sign(e.amount)}${Math.abs(e.amount)}`);
    case 'hitPoints':
      return line('points hit chance', e.amount, `${sign(e.amount)}${Math.abs(e.amount)}`);
    case 'critMult':
      return line('on crits', e.value, `×${e.value}`);
    case 'recoverySet':
      return line('recovery between floors', e.value, pct(e.value));
    case 'recoveryFloor':
      return line('Health at least after a floor', e.value, pct(e.value));
    case 'monsterSpeedPct':
      return line('monster Speed', e.amount, `${sign(e.amount)}${pct(e.amount)}`);
    case 'monsterMightPct':
      return line('monster Might', e.amount, `${sign(e.amount)}${pct(e.amount)}`);
    case 'monsterHitPoints':
      return line(
        "points monsters' hit chance",
        e.amount,
        `${sign(e.amount)}${Math.abs(e.amount)}`,
      );
    case 'monsterStartMeter':
      return line('turn meter at the start of each floor', e.value, `monsters begin at ${e.value}`);
    case 'knockbackEveryNth':
      return line('knock-back on every monster', -e.amount, `every ${e.every}th party action:`);
    case 'switch':
      return { label: switchText[e.switch], value: -1 };
  }
};

const switchText = {
  'knowledge-off': 'Studied and Mastered bonuses do not apply',
  'mender-never-heals': 'The Mender never heals',
  'health-per-action': 'Each hunter loses 3% of max Health on each of their own actions',
  'no-riftglass': 'This run pays no Riftglass',
  'no-recovery': 'No recovery between floors',
  'nothing-restores': 'Nothing restores Health: no healing, no getting up again',
} as const;

/** The breakdown of every blessing taken: its exact text, its gains, and (the Unlit's) its drawbacks as negatives. */
export const blessingsBreakdown = (ids: readonly string[]): Breakdown => {
  const children: Breakdown[] = [];
  for (const id of ids) {
    const b = blessingById(id);
    if (!b) continue;
    const lines: Breakdown[] = [...b.effects.map(effectLine)];
    if (b.rule) lines.push({ label: b.text, value: 1 });
    for (const d of b.drawbacks ?? []) {
      const l = effectLine(d);
      lines.push({ ...l, value: l.value > 0 ? -l.value : l.value });
    }
    children.push({ label: b.name, value: lines.length, formula: b.text, children: lines });
  }
  return { label: 'Your blessings', value: children.length, children };
};
