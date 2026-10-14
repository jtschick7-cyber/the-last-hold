import { arvidArrivalOnLoad } from '../../content/story/act3';
import { dispatch } from '../app/runtime';
import { openSheet } from '../app/sheets';
import styles from '../styles/ui.module.css';
import { DocumentReader } from '../screens/ArchiveScreen';

// GDD §5.14.1 (D214): a save whose cycle began Act III before it was written meets Arvid
// on load. This takes the Hold screen's place until he has arrived; More stays open (to
// export the save first). D3-01 plays as he comes through the door.

export const ActThreeArrivalView = () => (
  <div class={styles.card}>
    <h2 class={styles.cardTitle}>Ilse Marrow</h2>
    <p>{arvidArrivalOnLoad}</p>
    <button
      type="button"
      class={styles.btnPrimary}
      style={{ width: '100%' }}
      onClick={() => {
        if (!dispatch({ type: 'story.startActIII' }).ok) return;
        openSheet('The net-mender', () => (
          <div>
            <DocumentReader id="D3-01" />
            <p class={styles.small}>Arvid Netmender has joined your roster.</p>
          </div>
        ));
      }}
    >
      Welcome them
    </button>
  </div>
);
