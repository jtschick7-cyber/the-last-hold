import type { UpdateHandle } from '../../platform/service-worker';
import styles from './App.module.css';

// Technical design §11.1: offer the reload; never force it.
export const UpdateBanner = ({ update }: { update: UpdateHandle }) => (
  <div class={styles.banner} role="status">
    <span>New version: reload when ready.</span>
    <button type="button" class={styles.button} onClick={() => update.apply()}>
      Reload
    </button>
  </div>
);
