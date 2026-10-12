import { buildInfo } from '../../platform/build-info';
import { About } from '../app/About';
import styles from '../styles/ui.module.css';

// The full More menu (Reports, Save & Data, Settings, About & Credits) is plan
// T1.25; until then this shows the build details.
export const MoreScreen = () => (
  <div>
    <About info={buildInfo} />
    <p class={`${styles.small} ${styles.dim}`}>
      Save & Data, Settings and Reports arrive in the next update.
    </p>
  </div>
);
