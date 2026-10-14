import { skillViews } from '../../core/skills/skills';
import { emberNews, game, version } from '../app/runtime';
import styles from '../styles/ui.module.css';
import { Num } from '../widgets/Num';

// GDD §5.8.6, §9.13: "What the ember remembers", the four warden skills on the Rank
// screen: level, progress to the next, the bonus, and its breakdown on long-press.

export const SkillsView = () => {
  void version.value;
  const views = skillViews(game());
  return (
    <div>
      <h3 class={styles.cardTitle}>What the ember remembers</h3>
      {emberNews.value.map((line, i) => (
        <p key={i} class={`${styles.small} ${styles.good}`}>
          {line}
        </p>
      ))}
      <ul class={styles.list}>
        {views.map((v) => (
          <li key={v.id} class={styles.divider} style={{ padding: 'var(--space-2) 0' }}>
            <div class={styles.row}>
              <strong class={styles.grow}>
                {v.name} {v.level}
              </strong>
              <Num text={v.bonusText} breakdown={() => v.bonus.breakdown} marked />
            </div>
            <div class={`${styles.small} ${styles.dim}`}>{v.gives}</div>
            <div
              class={styles.meter}
              role="progressbar"
              aria-label={`${v.name} progress`}
              aria-valuemin={0}
              aria-valuemax={v.maxed ? 1 : v.progress.needed}
              aria-valuenow={v.maxed ? 1 : v.progress.into}
            >
              <div
                class={styles.meterFill}
                style={{ width: `${v.maxed ? 100 : (v.progress.into / v.progress.needed) * 100}%` }}
              />
            </div>
            <div class={`${styles.small} ${styles.dim}`}>
              {v.maxed
                ? 'Highest level'
                : `${v.progress.into} of ${v.progress.needed} XP to level ${v.level + 1}`}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
