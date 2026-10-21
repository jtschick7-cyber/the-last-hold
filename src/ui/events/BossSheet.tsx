import { bossSheetView } from '../../core/systems/events-view';
import { now } from '../../platform/clock';
import { formatNumber } from '../../core/format';
import { game, version } from '../app/runtime';
import { openSheet } from '../app/sheets';
import styles from '../styles/ui.module.css';
import { Num } from '../widgets/Num';
import { BossPartyView } from './BossPartyView';
import css from './Events.module.css';
import { openResult } from './ResultSheet';

// GDD §9.17 boss sheet: the Great Beast, its tier and pool with their breakdowns, the three
// milestone marks and what each pays, the tokens, and Send a party. The last result is below.
export const BossSheet = () => {
  void version.value;
  const v = bossSheetView(game(), now());
  return (
    <div>
      <h3 class={styles.cardTitle}>{v.name}</h3>
      <p class={`${styles.small} ${styles.dim}`}>{v.family}</p>
      <p>
        Tier <Num text={String(v.tier.value)} breakdown={() => v.tier.breakdown} marked />
        {' · '}
        Pool{' '}
        <Num
          text={`${formatNumber(v.poolLeft)} of ${formatNumber(v.poolStart)}`}
          breakdown={() => v.pool.breakdown}
          marked
        />
      </p>
      <div
        class={css.poolBar}
        role="img"
        aria-label={`${Math.round(v.fractionLeft * 100)}% of the pool is left`}
      >
        <div class={css.poolFill} style={{ width: `${v.fractionLeft * 100}%` }} />
        {v.marks.map((m) => (
          <div
            key={m.label}
            class={`${css.tick} ${m.paid ? css.tickPaid : ''}`}
            style={{ left: `${(1 - m.at) * 100}%` }}
          />
        ))}
      </div>
      <ul class={css.marks}>
        {v.marks.map((m) => (
          <li key={m.label} class={styles.small}>
            <strong>{m.label}</strong>
            {m.paid ? ' (paid)' : ''}: {m.pays}
          </li>
        ))}
      </ul>
      <p class={`${styles.small} ${styles.dim}`}>
        weak: {v.lines.weak}
        <br />
        resists: {v.lines.resists}
        <br />
        {v.lines.abilities.join(' · ')}
      </p>
      <p class={`${styles.small} ${styles.dim}`}>
        <em>{v.notebook}</em>
      </p>
      <p>
        <Num
          text={`Tokens ${v.tokens.value.count} of ${v.tokens.value.max}`}
          breakdown={() => v.tokens.breakdown}
        />
      </p>
      {v.emptyLine && <p class={styles.warn}>{v.emptyLine}</p>}
      <button
        type="button"
        class={styles.btnPrimary}
        style={{ width: '100%' }}
        disabled={v.sendProblem !== null}
        onClick={() => openSheet('Send a party', () => <BossPartyView />)}
      >
        Send a party
      </button>
      {v.sendProblem && !v.emptyLine && <p class={styles.small}>{v.sendProblem}</p>}
      {v.lastLine && (
        <p class={`${styles.small} ${styles.dim}`}>
          {v.lastLine}{' '}
          <button type="button" class={styles.btn} onClick={openResult}>
            Details ▸
          </button>
        </p>
      )}
    </div>
  );
};
