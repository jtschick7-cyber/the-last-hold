import { relics } from '../../content/relics';
import { UPGRADE_IDS, upgrades } from '../../content/warden-upgrades';
import { describeRelic, describeUpgrade } from '../../core/describe-long-night';
import { formatNumber } from '../../core/format';
import { upgradeCost } from '../../core/long-night/hearth';
import { dispatch, game, version } from '../app/runtime';
import styles from '../styles/ui.module.css';
import { Num } from '../widgets/Num';
import { Sprite } from '../widgets/Sprite';
import { EMBERS_ICON, relicIconId } from '../../content/assets';

// GDD §9.13 (D111, D115): The Hearth, in the Hearth Hall: Embers on hand, the warden
// upgrades, and the relics the hold owns. Open at any time; Embers carry over.
export const HearthView = () => {
  void version.value;
  const s = game();
  return (
    <div class={styles.card} style={{ marginTop: 'var(--space-3)' }}>
      <h3 class={styles.cardTitle}>The Hearth</h3>
      <p class={styles.small}>
        <Sprite id={EMBERS_ICON} /> <strong>{formatNumber(s.embers)} Embers</strong>{' '}
        <span class={styles.dim}>— what the last warden left in the hearth.</span>
      </p>
      <p class={`${styles.small} ${styles.dim}`}>Stars are bought on each hunter's sheet.</p>
      <ul class={styles.list}>
        {UPGRADE_IDS.map((id) => {
          const def = upgrades[id];
          const level = s.upgrades[id];
          const cost = upgradeCost(s, id);
          return (
            <li key={id} class={`${styles.row} ${styles.divider}`}>
              <span class={styles.grow}>
                <strong>{def.name}</strong>{' '}
                <span class={styles.dim}>
                  {level}/{def.maxLevel}
                </span>
                <br />
                <span class={`${styles.small} ${styles.dim}`}>
                  Each level: {describeUpgrade(id)}
                </span>
              </span>
              {cost ? (
                <button
                  type="button"
                  class={s.embers >= cost.value ? styles.btnPrimary : styles.btn}
                  disabled={s.embers < cost.value}
                  onClick={() => dispatch({ type: 'upgrade.buy', upgrade: id })}
                >
                  <Num
                    text={`${formatNumber(cost.value)} Embers`}
                    breakdown={() => cost.breakdown}
                  />
                </button>
              ) : (
                <span class={styles.dim}>Max</span>
              )}
            </li>
          );
        })}
      </ul>
      <h3 class={styles.cardTitle}>Relics</h3>
      {s.relics.length === 0 ? (
        <p class={`${styles.small} ${styles.dim}`}>None yet. The Last Stand finds them.</p>
      ) : (
        <ul class={styles.list}>
          {s.relics.map((r) => (
            <li key={r.id} class={styles.small}>
              <Sprite id={relicIconId(r.id)} /> <strong>{relics[r.id].name}</strong>:{' '}
              {describeRelic(r.id)} <span class={styles.dim}>(found in cycle {r.cycle})</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
