import { buildings } from '../../content/buildings';
import { formatDuration } from '../../core/format';
import { num } from '../../core/balance-access';
import { investigationSlots } from '../../core/investigation/lodge';
import { contractIdentity } from '../../core/investigation/view';
import { dispatch, game, version } from '../app/runtime';
import { candidateList } from '../app/knowledge-text';
import styles from '../styles/ui.module.css';

// GDD §5.6.3 and §9.4: a contract's clues, who it could still be, and the Lodge slot
// at work on it. Shown on the board and on the launch sheet.
export const InvestigationPanel = ({ contractId }: { contractId: string }) => {
  void version.value;
  const s = game();
  const contract = s.board.open.find((c) => c.id === contractId);
  if (!contract) return null;
  const v = contractIdentity(s, contract);
  const slots = investigationSlots(s);
  const slotIndex = s.queues.investigation.findIndex((q) => q.contractId === contractId);
  const working = slotIndex >= 0;
  const eta = working ? (s.queues.investigation[slotIndex]?.nextClueAt ?? s.time) - s.time : 0;
  const free = slots - s.queues.investigation.length;
  return (
    <div class={`${styles.small}`}>
      {v.clues.map((c) => (
        <div key={c.tag} class={styles.dim}>
          🔍 <em>“{c.text}”</em>
        </div>
      ))}
      {!v.identified && (
        <div>
          Could be: {candidateList(v.candidates)} · {v.clues.length}/3 clues
        </div>
      )}
      {v.identified && v.clues.length < 3 && v.clues.length > 0 && (
        <div class={styles.good}>The clues leave only one species.</div>
      )}
      {!v.identified && slots === 0 && (
        <div class={styles.dim}>Build a {buildings['hunters-lodge'].name} to investigate.</div>
      )}
      {!v.identified && slots > 0 && (
        <div class={styles.row}>
          {working ? (
            <>
              <span class={styles.grow}>
                Investigating · next clue in {formatDuration(eta / 1000)}
              </span>
              <button
                type="button"
                class={styles.btn}
                onClick={() => dispatch({ type: 'investigate.stop', contract: contractId })}
              >
                Stop
              </button>
            </>
          ) : (
            <>
              <span class={`${styles.grow} ${styles.dim}`}>
                {free > 0
                  ? `A clue takes up to ${formatDuration(num('clue.time'))}.`
                  : 'Every Lodge slot is busy.'}
              </span>
              <button
                type="button"
                class={styles.btn}
                disabled={free <= 0}
                onClick={() => dispatch({ type: 'investigate.assign', contract: contractId })}
              >
                Investigate
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};
