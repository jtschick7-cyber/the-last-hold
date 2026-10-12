import type { BuildInfo } from '../../platform/build-info';
import styles from '../styles/ui.module.css';

// Technical design §11.3: About shows the channel, version, branch and commit.
export const About = ({ info }: { info: BuildInfo }) => (
  <section class={styles.card} aria-labelledby="about-heading">
    <h2 id="about-heading" class={styles.cardTitle}>
      About this build
    </h2>
    <dl
      style={{
        display: 'grid',
        gridTemplateColumns: 'max-content 1fr',
        gap: '0.25rem 1rem',
        margin: 0,
      }}
    >
      <dt class={styles.dim}>Channel</dt>
      <dd style={{ margin: 0 }}>{info.channel === 'preview' ? 'Preview' : 'Live'}</dd>
      <dt class={styles.dim}>Version</dt>
      <dd style={{ margin: 0 }}>{info.version}</dd>
      <dt class={styles.dim}>Branch</dt>
      <dd style={{ margin: 0, overflowWrap: 'anywhere' }}>{info.branch}</dd>
      <dt class={styles.dim}>Commit</dt>
      <dd style={{ margin: 0 }}>{info.commit}</dd>
      <dt class={styles.dim}>Built</dt>
      <dd style={{ margin: 0 }}>{info.builtAt.slice(0, 16).replace('T', ' ')} UTC</dd>
    </dl>
    <p class={`${styles.small} ${styles.dim}`}>
      On iPhone, an app added to the Home Screen may need to be closed and reopened to pick up an
      update.
    </p>
  </section>
);
