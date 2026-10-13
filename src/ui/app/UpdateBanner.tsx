import type { UpdateHandle } from '../../platform/service-worker';
import styles from '../styles/ui.module.css';
import css from './App.module.css';

// Technical design §11.1: offer the reload; never force it. Saves first.
export const UpdateBanner = ({
  update,
  beforeReload,
}: {
  update: UpdateHandle;
  beforeReload: () => void;
}) => (
  <div class={css.banner} role="status">
    <span>New version: reload when ready.</span>
    <button
      type="button"
      class={styles.btnPrimary}
      onClick={() => {
        beforeReload();
        update.apply();
      }}
    >
      Reload
    </button>
  </div>
);
