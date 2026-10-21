import { vigilScene } from '../../content/text/remembering';
import { closeSheet, openSheet } from '../app/sheets';
import styles from '../styles/ui.module.css';

// GDD §5.15.3 (D453): Keep the Vigil's scene, R-10 "Later". Played once when it is chosen and
// replayed from the Library's shelf; it changes nothing in the game.
const VigilView = () => (
  <div>
    {vigilScene.paragraphs.map((p) => (
      <p key={p}>{p}</p>
    ))}
    <button type="button" class={styles.btnPrimary} style={{ width: '100%' }} onClick={closeSheet}>
      Continue
    </button>
  </div>
);

export const openVigilScene = (): void => openSheet(vigilScene.title, () => <VigilView />);
