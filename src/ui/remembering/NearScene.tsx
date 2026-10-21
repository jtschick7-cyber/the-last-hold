import { rememberingNearScene } from '../../core/story/remembering-view';
import { dispatch, game } from '../app/runtime';
import { closeSheet, openSheet } from '../app/sheets';
import styles from '../styles/ui.module.css';

// GDD §5.15.2 (D450, D461 (4)): Pechko's near-scene. It counts as seen only when it is closed with
// Continue; closing it with the ✕ leaves it waiting.
const NearView = () => {
  const scene = rememberingNearScene(game());
  if (!scene) return <p>Nothing here.</p>;
  return (
    <div>
      {scene.paragraphs.map((p) => (
        <p key={p}>{p}</p>
      ))}
      <button
        type="button"
        class={styles.btnPrimary}
        style={{ width: '100%' }}
        onClick={() => {
          dispatch({ type: 'remembering.seeNear' });
          closeSheet();
        }}
      >
        Continue
      </button>
    </div>
  );
};

/** Opens the scene that is waiting (R-01 or R-02); false when none is. */
export const openNearScene = (): boolean => {
  const scene = rememberingNearScene(game());
  if (!scene) return false;
  openSheet(scene.title, () => <NearView />);
  return true;
};
