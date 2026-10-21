import { eventsCardView } from '../../core/systems/events-view';
import { now } from '../../platform/clock';
import { game, version } from '../app/runtime';
import { openSheet } from '../app/sheets';
import styles from '../styles/ui.module.css';
import { Num } from '../widgets/Num';
import { BossSheet } from './BossSheet';
import css from './Events.module.css';

// GDD §9.17: the Events card, under the Rift card. No new tab (D366). It exists once events have
// opened for good; before the Citadel in a new cycle it says so and the tokens keep counting.
export const EventsCard = () => {
  void version.value;
  const v = eventsCardView(game(), now());
  if (!v) return null;
  return (
    <section class={styles.card} aria-label="Events">
      <h2 class={styles.cardTitle}>
        Events
        {v.badge && (
          <span class={css.badge} aria-label="The attempt bank is full">
            ●
          </span>
        )}
      </h2>
      <p>
        <Num text={v.tokensLine} breakdown={() => v.tokens.breakdown} />
      </p>
      {v.lockedLine && <p class={styles.dim}>{v.lockedLine}</p>}
      {v.bossLine && <p>{v.bossLine}</p>}
      {v.huntLine && <p class={styles.dim}>{v.huntLine}</p>}
      {v.lastLine && <p class={`${styles.small} ${styles.dim}`}>{v.lastLine}</p>}
      {!v.locked && (
        <button
          type="button"
          class={styles.btnPrimary}
          style={{ width: '100%' }}
          onClick={() => openSheet('The Great Beast', () => <BossSheet />)}
        >
          The Great Beast ▸
        </button>
      )}
    </section>
  );
};
