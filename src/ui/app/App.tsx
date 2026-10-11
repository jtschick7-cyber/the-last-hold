import { useEffect } from 'preact/hooks';
import { signal } from '@preact/signals';
import { buildInfo } from '../../platform/build-info';
import type { UpdateHandle } from '../../platform/service-worker';
import { About } from './About';
import { UpdateBanner } from './UpdateBanner';
import styles from './App.module.css';

export const pendingUpdate = signal<UpdateHandle | null>(null);

export interface AppProps {
  /** How many times this channel has been opened, or null if storage is unavailable. */
  opens: number | null;
}

export const App = ({ opens }: AppProps) => {
  useEffect(() => {
    document.documentElement.dataset.channel = buildInfo.channel;
  }, []);

  return (
    <div class={styles.app}>
      {buildInfo.channel === 'preview' && (
        <div class={styles.ribbon} aria-label="Preview build">
          PREVIEW
        </div>
      )}
      <main class={styles.main}>
        <h1 class={styles.title}>The Last Hold</h1>
        <p class={styles.lede}>The hearth is lit. There is nothing to build yet.</p>
        <About info={buildInfo} opens={opens} />
      </main>
      {pendingUpdate.value && <UpdateBanner update={pendingUpdate.value} />}
    </div>
  );
};
