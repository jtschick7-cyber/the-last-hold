import { hunterPortraitId, WRIGHTS_BLADE_ICON } from '../../content/assets';
import { hunters, roleNames, type HunterId } from '../../content/hunters';
import { formatDuration, formatNumber } from '../../core/format';
import { wornItem } from '../../core/systems/items';
import { slotPicker } from '../../core/systems/slot-picker';
import type { GearSlot } from '../../content/gear';
import { legendaries } from '../../content/legendaries';
import { hunterStat, hunterStatus, levelCap, xpToNext } from '../../core/systems/hunters';
import { dispatch, game, version } from '../app/runtime';
import { openSheet } from '../app/sheets';
import styles from '../styles/ui.module.css';
import { Num } from '../widgets/Num';
import { Sprite } from '../widgets/Sprite';
import { HunterLetters } from './HunterLetters';
import { RankStars, UseSkillRow } from './HunterDepth';
import { KeepsakePickerSheet, SlotPickerSheet } from './SlotPickerSheet';
import { TalentView } from './TalentView';
import { TraitList } from '../delve/TraitList';

// GDD §9.7, §9.16 hunter detail: stats with breakdowns, rank and stars, the use-skill, the three
// slots (weapon, armor, keepsake) each opening its picker, talents, the record, and a short bio.
const Slot = ({ id, slot }: { id: HunterId; slot: GearSlot }) => {
  void version.value; // a child sheet part re-renders only by its own signal
  const s = game();
  const h = s.hunters[id];
  if (!h) return null;
  const view = slotPicker(s, id, slot);
  const worn = view?.worn;
  return (
    <div class={styles.row}>
      <span class={styles.grow}>
        {slot === 'weapon' ? 'Weapon' : 'Armor'}:{' '}
        {slot === 'weapon' && wornItem(s, h, 'weapon')?.base === 'wrights-blade' && (
          <Sprite id={WRIGHTS_BLADE_ICON} />
        )}{' '}
        <strong>{worn ? worn.name : '—'}</strong>
        {worn && (
          <div class={`${styles.small} ${styles.dim}`}>
            {[worn.base, ...worn.lines].filter((x) => x !== '').join(' · ')}
          </div>
        )}
      </span>
      <button
        type="button"
        class={styles.btn}
        onClick={() =>
          openSheet(`${hunters[id].shortName}: ${slot}`, () => (
            <SlotPickerSheet id={id} slot={slot} />
          ))
        }
      >
        Change
      </button>
    </div>
  );
};

const KeepsakeSlot = ({ id }: { id: HunterId }) => {
  void version.value; // a child sheet part re-renders only by its own signal
  const h = game().hunters[id];
  if (!h) return null;
  return (
    <div class={styles.row}>
      <span class={styles.grow}>
        Keepsake: <strong>{h.keepsake ? legendaries[h.keepsake].name : '—'}</strong>
        {h.keepsake && (
          <div class={`${styles.small} ${styles.dim}`}>{legendaries[h.keepsake].text}</div>
        )}
      </span>
      <button
        type="button"
        class={styles.btn}
        onClick={() =>
          openSheet(`${hunters[id].shortName}: keepsake`, () => <KeepsakePickerSheet id={id} />)
        }
      >
        Change
      </button>
    </div>
  );
};

export const HunterView = ({ id }: { id: HunterId }) => {
  void version.value;
  const s = game();
  const def = hunters[id];
  const h = s.hunters[id];
  if (!h) return <p>{def.name} isn't with you.</p>;
  const status = hunterStatus(s, id);
  const stat = (n: 'health' | 'might' | 'armor' | 'speed') => hunterStat(s, id, n);
  const need = xpToNext(h.level);
  const active = s.roster.active.includes(id);
  return (
    <div>
      <div class={styles.row}>
        <Sprite id={hunterPortraitId(id)} scale={2} />
        <p class={`${styles.dim} ${styles.grow}`}>
          {roleNames[def.role]} · {def.damage} damage · {def.origin} · Lv {h.level}
          {h.level >= levelCap(s) ? ' (max)' : ` · ${Math.floor(h.xp)}/${Math.round(need)} XP`}
        </p>
      </div>
      <p class={styles.small}>
        {status === 'recovering' && h.recovery
          ? `✚ ${h.recovery.kind}, back in ${formatDuration((h.recovery.until - s.time) / 1000)}`
          : status === 'on-contract'
            ? '⏱ On a contract'
            : status === 'in-delve'
              ? '▼ In a Delve'
              : status === 'ready'
                ? '● Ready'
                : 'In the reserve'}
      </p>
      <div class={styles.cost}>
        {(['health', 'might', 'armor', 'speed'] as const).map((n) => (
          <span key={n}>
            {n.charAt(0).toUpperCase()}{' '}
            <Num text={formatNumber(stat(n).value)} breakdown={() => stat(n).breakdown} marked />
          </span>
        ))}
      </div>
      <RankStars id={id} />
      <UseSkillRow id={id} />
      <TraitList id={id} />
      <Slot id={id} slot="weapon" />
      <Slot id={id} slot="armor" />
      <KeepsakeSlot id={id} />
      <TalentView id={id} />
      <p class={styles.small}>
        Record: {h.record.won} won · {h.record.lost} lost
      </p>
      <HunterLetters id={id} />
      <p class={`${styles.small} ${styles.dim}`}>{def.bio}</p>
      <button
        type="button"
        class={styles.btn}
        onClick={() => dispatch({ type: 'roster.set', hunter: id, active: !active })}
        disabled={status === 'on-contract' || status === 'in-delve' || status === 'recovering'}
      >
        {active ? 'Move to the reserve' : 'Make active'}
      </button>
    </div>
  );
};
