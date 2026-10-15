import { arvidArrivalOnLoad } from '../../content/story/act3';
import { DocumentReader } from '../screens/ArchiveScreen';
import styles from '../styles/ui.module.css';
import { OnLoadCard } from './OnLoadCard';

// GDD §5.14.1 (D214): a save whose cycle began Act III before it was written meets Arvid on load.
// D3-01 plays as he comes through the door.
export const ActThreeArrivalView = () => (
  <OnLoadCard
    title="Ilse Marrow"
    line={arvidArrivalOnLoad}
    button="Welcome them"
    command={{ type: 'story.startActIII' }}
    sheet="The net-mender"
  >
    <div>
      <DocumentReader id="D3-01" />
      <p class={styles.small}>Arvid Netmender has joined your roster.</p>
    </div>
  </OnLoadCard>
);
