import { currentAct } from '../../core/story/documents';
import { hunters } from '../../content/hunters';
import { monsters } from '../../content/monsters';
import { num } from '../../core/balance-access';
import { formatDuration } from '../../core/format';
import { noticeFor } from '../../core/contracts/notice';
import { contractDuration, holdBounty, trophies } from '../../core/contracts/rewards';
import type { ContractInstance } from '../../core/state/game-state';
import { dispatch, game, version } from '../app/runtime';
import { openSheet } from '../app/sheets';
import { placeName } from '../app/contract-text';
import { contractIdentity } from '../../core/investigation/view';
import { identityText } from '../app/knowledge-text';
import { LaunchView } from '../sheets/LaunchSheet';
import { ResultsView } from '../sheets/ResultsSheet';
import styles from '../styles/ui.module.css';
import { InvestigationPanel } from '../widgets/InvestigationPanel';
import { ResourceIcon } from '../widgets/ResourceIcon';
import { VillagesPanel } from '../widgets/VillagesPanel';

// GDD §9.4: the contract board. Running contracts, what is ready to collect, and
// the open contracts, each with what it pays and what it takes.
const durationOf = (c: ContractInstance): number => contractDuration(game(), c.tier).value;

const Open = ({ c }: { c: ContractInstance }) => {
  const s = game();
  const notice = noticeFor(c, s.meta.gameSeed, currentAct(s), s.story.trust[c.village].level);
  const pay = holdBounty(s, c.tier, []).value;
  return (
    <li class={styles.divider} style={{ padding: 'var(--space-2) 0' }}>
      <strong>
        {placeName(c)} · T{c.tier}
      </strong>
      <div class={`${styles.small} ${styles.dim}`}>
        <em>“{notice.text}”</em> {notice.signature}
      </div>
      <div class={styles.small}>
        {identityText(contractIdentity(s, c))}
        {s.queues.investigation.some((q) => q.contractId === c.id) ? ' · 🔍 investigating' : ''}
      </div>
      <InvestigationPanel contractId={c.id} />
      <div class={`${styles.cost} ${styles.small}`}>
        <span>
          {Math.round(pay)} <ResourceIcon r="silver" />
        </span>
        <span>🏆 {trophies(c.tier)}</span>
        <span>{formatDuration(durationOf(c))}</span>
      </div>
      <div class={styles.row}>
        <button
          type="button"
          class={styles.btnPrimary}
          onClick={() => openSheet('Send hunters', () => <LaunchView contractId={c.id} />)}
        >
          Prepare
        </button>
        <button
          type="button"
          class={styles.btn}
          onClick={() => dispatch({ type: 'contract.decline', contract: c.id })}
        >
          Decline
        </button>
      </div>
    </li>
  );
};

export const ContractsScreen = () => {
  void version.value;
  const s = game();
  const cap = num('board.cap');
  const next = s.board.nextArrivalAt;
  const collect = (): void => {
    const results = [...s.results];
    if (dispatch({ type: 'results.collect' }).ok) {
      openSheet('Contracts finished', () => <ResultsView results={results} ember />);
    }
  };
  return (
    <div>
      <VillagesPanel />
      <section class={styles.card} aria-labelledby="board-title">
        <h2 id="board-title" class={styles.cardTitle}>
          Board {s.board.open.length}/{cap}
          <span class={`${styles.small} ${styles.dim}`} style={{ textTransform: 'none' }}>
            {next === null
              ? s.board.open.length >= cap
                ? 'full'
                : ''
              : next <= s.time
                ? 'next any moment'
                : `next in ${formatDuration((next - s.time) / 1000)}`}
          </span>
        </h2>
        {s.running.length > 0 && (
          <div>
            <h3 class={styles.cardTitle}>⏱ Running</h3>
            <ul class={styles.list}>
              {s.running.map((r) => (
                <li key={r.contract.id} class={styles.divider}>
                  {contractIdentity(s, r.contract).identified
                    ? monsters[r.contract.monster].name
                    : 'Unknown monster'}{' '}
                  · T{r.contract.tier} · {formatDuration((r.endsAt - s.time) / 1000)} left
                  <div class={`${styles.small} ${styles.dim}`}>
                    {r.party.map((h) => hunters[h].shortName).join(', ')}
                    {r.reckless ? ' · Reckless' : ''}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
        {s.results.length > 0 && (
          <div class={styles.row}>
            <span class={`${styles.grow} ${styles.good}`}>
              ✔ Ready to collect ({s.results.length})
            </span>
            <button type="button" class={styles.btnPrimary} onClick={collect}>
              Collect
            </button>
          </div>
        )}
        <h3 class={styles.cardTitle}>Open</h3>
        {s.board.open.length === 0 ? (
          <p class={styles.dim}>No contracts yet. They arrive every two hours and wait for you.</p>
        ) : (
          <ul class={styles.list}>
            {s.board.open.map((c) => (
              <Open key={c.id} c={c} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};
