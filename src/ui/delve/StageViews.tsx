import { useState } from 'preact/hooks';
import { sigilIconId } from '../../content/assets';
import type { StageView } from '../../core/delves/view-run';
import { dispatch } from '../app/runtime';
import styles from '../styles/ui.module.css';
import { BlessingButton, DoorButton } from './Cards';

// GDD §9.15 Doors, Blessing and Chosen start. Doors and the first step of a Chosen start choose on
// tap (a patron is only a pair of cards away); a blessing is selected, then taken.

const Offer = ({
  v,
  rerollable,
}: {
  v: Extract<StageView, { kind: 'offer' | 'start' }>;
  rerollable: boolean;
}) => {
  const [picked, setPicked] = useState<string | null>(null);
  const patron = v.patron;
  if (!patron) return null;
  return (
    <div>
      <h3 class={styles.cardTitle}>{v.title}</h3>
      <p class={styles.dim}>
        <strong>{patron.name}</strong> offers a blessing. It lasts until the run ends.
      </p>
      {v.cards.map((c) => (
        <BlessingButton
          key={c.id}
          card={c}
          sigilId={sigilIconId(patron.patron)}
          picked={picked === c.id}
          onPick={() => setPicked(c.id)}
        />
      ))}
      <button
        type="button"
        class={styles.btnPrimary}
        style={{ width: '100%' }}
        disabled={picked === null}
        onClick={() => picked && dispatch({ type: 'delve.chooseBlessing', blessing: picked })}
      >
        Take this blessing
      </button>
      {v.kind === 'offer' && v.reroll !== 'none' && (
        <button
          type="button"
          class={styles.btn}
          style={{ width: '100%', marginTop: 'var(--space-2)' }}
          disabled={!rerollable}
          onClick={() => {
            setPicked(null);
            dispatch({ type: 'delve.reroll' });
          }}
        >
          {rerollable ? 'Re-roll (once per run)' : 'Re-rolled this run'}
        </button>
      )}
    </div>
  );
};

export const StageViewScreen = ({ v }: { v: StageView }) => {
  if (v.kind === 'doors')
    return (
      <div>
        <h3 class={styles.cardTitle}>{v.title}</h3>
        <p class={styles.dim}>Two doors. Each is a patron's; you may take one blessing from it.</p>
        {v.doors.map((d) => (
          <DoorButton
            key={d.patron}
            door={d}
            sub={v.ahead}
            onPick={() => dispatch({ type: 'delve.chooseDoor', patron: d.patron })}
          />
        ))}
      </div>
    );
  if (v.kind === 'start' && v.patron === null)
    return (
      <div>
        <h3 class={styles.cardTitle}>{v.title}</h3>
        <p class={styles.dim}>Pick a patron, then one of three Faint blessings from them.</p>
        {v.choices.map((d) => (
          <DoorButton
            key={d.patron}
            door={d}
            onPick={() => dispatch({ type: 'delve.chooseStart', patron: d.patron })}
          />
        ))}
      </div>
    );
  return <Offer v={v} rerollable={v.kind === 'offer' && v.reroll === 'available'} />;
};
