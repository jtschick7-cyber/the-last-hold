import { hunters, roleNames, type HunterId } from '../../content/hunters';
import { formatDuration, formatNumber } from '../../core/format';
import {
  candidates,
  describeUnlock,
  hunterStatus,
  lockedHunters,
  rosterCap,
} from '../../core/systems/hunters';
import { dispatch, game, version } from '../app/runtime';
import { openSheet } from '../app/sheets';
import { HunterView } from '../sheets/HunterSheet';
import styles from '../styles/ui.module.css';
import { ResourceIcon } from '../widgets/ResourceIcon';

// GDD §9.7: active roster, reserve, candidates, and locked silhouettes.
const Card = ({ id }: { id: HunterId }) => {
  const s = game();
  const def = hunters[id];
  const h = s.hunters[id];
  const status = hunterStatus(s, id);
  if (!h) return null;
  const line =
    status === 'recovering' && h.recovery
      ? `✚ ${h.recovery.kind} · ${formatDuration((h.recovery.until - s.time) / 1000)}`
      : status === 'on-contract'
        ? '⏱ On contract'
        : status === 'ready'
          ? '● Ready'
          : 'Reserve';
  return (
    <li class={styles.divider}>
      <button
        type="button"
        class={styles.btn}
        style={{ width: '100%', textAlign: 'left', border: 'none', background: 'none' }}
        onClick={() => openSheet(def.name, () => <HunterView id={id} />)}
      >
        <strong>{def.name}</strong>
        <div class={`${styles.small} ${styles.dim}`}>
          {roleNames[def.role]} · {def.damage} · Lv {h.level} · {line}
        </div>
      </button>
    </li>
  );
};

export const HuntersScreen = () => {
  void version.value;
  const s = game();
  const cap = rosterCap(s).value;
  const reserve = Object.keys(s.hunters).filter(
    (id) => !s.roster.active.includes(id as HunterId),
  ) as HunterId[];
  const cands = candidates(s);
  const locked = lockedHunters(s);
  return (
    <div>
      <section class={styles.card}>
        <h2 class={styles.cardTitle}>
          Active {s.roster.active.length}/{cap} · Reserve {reserve.length}
        </h2>
        <ul class={styles.list}>
          {s.roster.active.map((id) => (
            <Card key={id} id={id} />
          ))}
        </ul>
        {reserve.length > 0 && (
          <div>
            <h3 class={styles.cardTitle}>Reserve</h3>
            <ul class={styles.list}>
              {reserve.map((id) => (
                <Card key={id} id={id} />
              ))}
            </ul>
          </div>
        )}
      </section>
      {cands.length > 0 && (
        <section class={styles.card}>
          <h2 class={styles.cardTitle}>Candidates</h2>
          <ul class={styles.list}>
            {cands.map((c) => (
              <li key={c.id} class={`${styles.row} ${styles.divider}`}>
                <span class={styles.grow}>
                  <strong>{c.name}</strong>
                  <div class={`${styles.small} ${styles.dim}`}>
                    {roleNames[c.role]} · {c.damage} · {c.sketch}
                  </div>
                </span>
                <button
                  type="button"
                  class={s.resources.silver >= c.recruitPrice ? styles.btnPrimary : styles.btn}
                  disabled={s.resources.silver < c.recruitPrice}
                  onClick={() => dispatch({ type: 'hunter.recruit', hunter: c.id })}
                >
                  Hire <ResourceIcon r="silver" /> {formatNumber(c.recruitPrice)}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
      {locked.length > 0 && (
        <section class={styles.card}>
          <h2 class={styles.cardTitle}>Not yet arrived</h2>
          <ul class={styles.list}>
            {locked.map((c) => (
              <li key={c.id} class={`${styles.divider} ${styles.dim}`}>
                ▒ ??? · {roleNames[c.role]} · {describeUnlock(c.unlock)}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};
