import { type HunterId } from '../../content/hunters';
import { traits } from '../../content/traits';
import { delvesOpen } from '../../core/delves/access';
import { traitSwitchView } from '../../core/delves/view-shop';
import { effectiveTraits } from '../../core/systems/hunters';
import { dispatch, game, version } from '../app/runtime';
import styles from '../styles/ui.module.css';

// GDD §5.10.8, §9.15: a hunter's traits. Once their other second trait is bought (Riftglass shop,
// Rank screen), both are shown and the hunter switches between them while free (D260).
export const TraitList = ({ id }: { id: HunterId }) => {
  void version.value;
  const s = game();
  const view = delvesOpen(s) ? traitSwitchView(s, id) : null;
  const now =
    view?.current ??
    effectiveTraits(s, id).map((t) => ({ name: traits[t].name, summary: traits[t].summary }));
  return (
    <div>
      <ul class={styles.list}>
        {now.map((t) => (
          <li key={t.name}>
            <strong>{t.name}:</strong> {t.summary}
          </li>
        ))}
      </ul>
      {view?.bought && view.other && (
        <div class={styles.card}>
          <p class={styles.small}>
            <strong>Other second trait: {view.other.name}.</strong> {view.other.summary}
          </p>
          <button
            type="button"
            class={styles.btn}
            disabled={view.problem !== null}
            onClick={() =>
              dispatch({ type: 'riftglass.switchTrait', hunter: id, alternate: !view.active })
            }
          >
            Switch to {view.other.name}
          </button>
          {view.problem && <span class={`${styles.small} ${styles.warn}`}> {view.problem}</span>}
        </div>
      )}
    </div>
  );
};
