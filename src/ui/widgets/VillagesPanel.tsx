import { TRUST_LEVELS, trustLevels, trustProgressLine } from '../../content/story/trust';
import { VILLAGE_IDS, villages } from '../../content/villages';
import { mootPanelEntries } from '../../core/story/orders-views';
import { stepNeed, trustBreakdown } from '../../core/story/trust';
import { game, version } from '../app/runtime';
import styles from '../styles/ui.module.css';
import { Num } from './Num';

// GDD §5.14.6, §9.14: the Villages panel above the open contracts, collapsible. Each
// village's trust level, its one-line description, and its progress toward the next
// step; long-press the progress for what counts toward it.
export const VillagesPanel = () => {
  void version.value;
  const s = game();
  const heads = mootPanelEntries(s);
  return (
    <details class={styles.card} style={{ marginBottom: 'var(--space-3)' }}>
      <summary class={styles.cardTitle}>Villages</summary>
      <ul class={styles.list}>
        {VILLAGE_IDS.map((id) => {
          const t = s.story.trust[id];
          const need = stepNeed(t.level);
          const next = TRUST_LEVELS[TRUST_LEVELS.indexOf(t.level) + 1];
          return (
            <li key={id} class={styles.divider}>
              <strong>{villages[id].name}</strong>{' '}
              <span class={styles.dim}>· {trustLevels[t.level].label}</span>
              <div class={styles.small}>{trustLevels[t.level].line}</div>
              <div class={`${styles.small} ${styles.dim}`}>
                {need === null || next === undefined ? (
                  'Sworn'
                ) : (
                  <Num
                    text={trustProgressLine(t.progress, need, next)}
                    breakdown={() => trustBreakdown(s, id).breakdown}
                    marked
                  />
                )}
              </div>
            </li>
          );
        })}
      </ul>
      {heads.length > 0 && (
        <>
          <h3 class={styles.cardTitle}>What the heads say about you</h3>
          <ul class={styles.list}>
            {heads.map((h) => (
              <li key={h.head} class={styles.divider}>
                <strong>{h.head}</strong>{' '}
                <span class={styles.dim}>· {villages[h.village].name}</span>
                <div class={styles.small}>{h.entry}</div>
              </li>
            ))}
          </ul>
        </>
      )}
    </details>
  );
};
