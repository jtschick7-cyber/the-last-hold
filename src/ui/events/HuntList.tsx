import { huntListView } from '../../core/systems/events-results';
import { now } from '../../platform/clock';
import { game, version } from '../app/runtime';
import { openSheet } from '../app/sheets';
import styles from '../styles/ui.module.css';
import { Num } from '../widgets/Num';
import { Sprite } from '../widgets/Sprite';
import css from './Events.module.css';
import { HuntTrackSheet } from './HuntTrackSheet';
import { openResult } from './ResultSheet';

// GDD §9.17 hunt list: the three hunts, each with its quarry, its legendary hunter's portrait (greyed
// until unlocked), points with a breakdown, and the three tracks with their restrictions and tiers.
export const HuntList = () => {
  void version.value;
  const s = game();
  const hunts = huntListView(s, now());
  const last = s.events.last?.kind === 'hunt';
  return (
    <div>
      {last && (
        <button type="button" class={styles.btn} onClick={openResult}>
          Last hunt ▸
        </button>
      )}
      {hunts.map((h) => (
        <section key={h.id} class={styles.card} aria-label={h.label}>
          <div class={styles.row}>
            <span class={h.hunterGreyed ? css.greyed : undefined}>
              <Sprite id={h.portraitId} scale={2} />
            </span>
            <div class={styles.grow}>
              <h3 class={styles.cardTitle}>{h.quarryName}</h3>
              <p class={`${styles.small} ${styles.dim}`}>
                {h.hunterGreyed
                  ? `Hunter to be won: ${h.hunterName}`
                  : `${h.hunterName} has joined`}
              </p>
            </div>
          </div>
          <p>
            Points <Num text={h.pointsLine} breakdown={() => h.points.breakdown} marked />
          </p>
          {h.footer && <p class={styles.good}>{h.footer}</p>}
          <ul class={styles.list}>
            {h.tracks.map((t) => (
              <li key={t.id} class={styles.divider}>
                <button
                  type="button"
                  class={styles.linkRow}
                  onClick={() =>
                    openSheet(`${h.quarryName} · ${t.name}`, () => <HuntTrackSheet track={t.id} />)
                  }
                >
                  <span class={styles.grow}>
                    <strong>{t.name}</strong> · tier {t.tier}
                    <div class={`${styles.small} ${styles.dim}`}>
                      {t.restriction} · win {t.winPoints}, loss {t.lossPoints}
                    </div>
                    {t.lockedReason && (
                      <div class={`${styles.small} ${css.reason}`}>{t.lockedReason}</div>
                    )}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
};
