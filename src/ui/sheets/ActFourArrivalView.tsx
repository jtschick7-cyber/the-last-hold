import { act4ArrivalOnLoad } from '../../content/story/act4';
import { dispatch } from '../app/runtime';
import { openSheet } from '../app/sheets';
import styles from '../styles/ui.module.css';
import { DocumentReader } from '../screens/ArchiveScreen';

// GDD §5.14.1 (D246): a save whose cycle was story-less when Act IV shipped meets Pechko's bundle
// on load. This takes the Hold screen's place until it has been opened; More stays open (to export
// the save first). D4-01 plays as he comes out from behind the stove.
export const ActFourArrivalView = () => (
  <div class={styles.card}>
    <h2 class={styles.cardTitle}>Pechko</h2>
    <p>{act4ArrivalOnLoad}</p>
    <button
      type="button"
      class={styles.btnPrimary}
      style={{ width: '100%' }}
      onClick={() => {
        if (!dispatch({ type: 'story.startActIV' }).ok) return;
        openSheet('The bundle', () => <DocumentReader id="D4-01" />);
      }}
    >
      See what he brought
    </button>
  </div>
);
