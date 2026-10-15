import { useState } from 'preact/hooks';
import type { HunterId } from '../../content/hunters';
import { talentSheet } from '../../core/systems/talents';
import { dispatch, game } from '../app/runtime';
import styles from '../styles/ui.module.css';

// GDD §9.16 (v0.8, D326): three branch columns of three tiers. A locked tier shows what it needs
// ("needs 2 stars"); respec is free. Core's `talentSheet` decides every cell and every reason.
export const TalentView = ({ id }: { id: HunterId }) => {
  const s = game();
  const view = talentSheet(s, id);
  const [note, setNote] = useState<string | null>(null);
  const h = s.hunters[id];
  if (!view || !h) return null;
  const run = (type: 'talent.pick' | 'talent.respec', talent?: string): void => {
    const r = dispatch(
      type === 'talent.pick' ? { type, hunter: id, talent: talent ?? '' } : { type, hunter: id },
    );
    setNote(r.ok ? null : r.reason);
  };
  return (
    <div>
      <h3 class={styles.cardTitle}>
        Talents{' '}
        {view.points > 0 && (
          <span class={styles.badge}>
            {view.points} {view.points === 1 ? 'point' : 'points'} to spend
          </span>
        )}
      </h3>
      <div class={styles.talentGrid}>
        {view.branches.map((b) => (
          <div key={b.id} class={styles.talentCol}>
            <strong>{b.name}</strong>
            {b.cells.map((c) => (
              <div key={c.talent.id} class={styles.small} style={{ marginTop: 'var(--space-2)' }}>
                <div class={c.picked ? styles.good : undefined}>
                  {c.picked ? '✔ ' : ''}Tier {c.talent.tier}: {c.talent.text}
                </div>
                {!c.picked && (
                  <button
                    type="button"
                    class={c.problem === null ? styles.btnPrimary : styles.btn}
                    disabled={c.problem !== null}
                    onClick={() => run('talent.pick', c.talent.id)}
                  >
                    Pick
                  </button>
                )}
                {!c.picked && c.problem && <div class={styles.dim}>{c.problem}</div>}
              </div>
            ))}
          </div>
        ))}
      </div>
      {view.delveNote && <p class={`${styles.small} ${styles.dim}`}>{view.delveNote}</p>}
      {h.talents.length > 0 && (
        <button type="button" class={styles.btn} onClick={() => run('talent.respec')}>
          Respec (free)
        </button>
      )}
      {note && <p class={`${styles.small} ${styles.warn}`}>{note}</p>}
    </div>
  );
};
