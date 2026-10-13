import { hunterPortraitId } from '../../content/assets';
import { hunters, roleNames, type HunterId } from '../../content/hunters';
import { traits } from '../../content/traits';
import { formatDuration, formatNumber } from '../../core/format';
import { RESOURCE_IDS } from '../../content/resources';
import {
  hunterStat,
  hunterStatus,
  levelCap,
  nextGear,
  slotGear,
  xpToNext,
} from '../../core/systems/hunters';
import { dispatch, game, version } from '../app/runtime';
import styles from '../styles/ui.module.css';
import { Num } from '../widgets/Num';
import { ResourceIcon } from '../widgets/ResourceIcon';
import { Sprite } from '../widgets/Sprite';

// GDD §9.7 hunter detail: stats with breakdowns, traits, gear and its upgrade,
// the record, and a short bio.
const Slot = ({ id, slot }: { id: HunterId; slot: 'weapon' | 'armor' }) => {
  const s = game();
  const h = s.hunters[id];
  if (!h) return null;
  const current = slotGear(h, slot);
  const next = nextGear(h, slot);
  const smithy = next ? s.buildings[next.requires.building] : 0;
  const locked = next ? smithy < next.requires.level : false;
  const affordable = next
    ? RESOURCE_IDS.every((r) => s.resources[r] >= (next.cost[r] ?? 0))
    : false;
  return (
    <div class={styles.row}>
      <span class={styles.grow}>
        {slot === 'weapon' ? 'Weapon' : 'Armor'}: <strong>{current ? current.name : '—'}</strong>
        {next && (
          <div class={`${styles.small} ${styles.dim}`}>
            Next: {next.name}
            {next.silverSubHit ? ' (adds a Silver sub-hit)' : ''}
            {next.fireTakenReduction > 0 ? ' (−10% Fire taken)' : ''}
            {next.might > 0 ? ` · +${next.might} Might` : ''}
            {next.armor > 0 ? ` · +${next.armor} Armor` : ''}
            {locked ? ` · needs Smithy ${next.requires.level}` : ''}
            <span class={styles.cost}>
              {RESOURCE_IDS.filter((r) => (next.cost[r] ?? 0) > 0).map((r) => (
                <span
                  key={r}
                  class={s.resources[r] >= (next.cost[r] ?? 0) ? undefined : styles.short}
                >
                  <ResourceIcon r={r} /> {formatNumber(next.cost[r] ?? 0)}
                </span>
              ))}
            </span>
          </div>
        )}
      </span>
      {next && (
        <button
          type="button"
          class={affordable && !locked ? styles.btnPrimary : styles.btn}
          disabled={!affordable || locked}
          onClick={() => dispatch({ type: 'gear.upgrade', hunter: id, slot })}
        >
          Upgrade
        </button>
      )}
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
      <ul class={styles.list}>
        {def.traits.map((t) => (
          <li key={t}>
            <strong>{traits[t].name}:</strong> {traits[t].summary}
          </li>
        ))}
      </ul>
      <Slot id={id} slot="weapon" />
      <Slot id={id} slot="armor" />
      <p class={styles.small}>
        Record: {h.record.won} won · {h.record.lost} lost
      </p>
      <p class={`${styles.small} ${styles.dim}`}>{def.bio}</p>
      <button
        type="button"
        class={styles.btn}
        onClick={() => dispatch({ type: 'roster.set', hunter: id, active: !active })}
        disabled={status === 'on-contract' || status === 'recovering'}
      >
        {active ? 'Move to the reserve' : 'Make active'}
      </button>
    </div>
  );
};
