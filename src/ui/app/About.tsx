import type { BuildInfo } from '../../platform/build-info';
import styles from './App.module.css';

export interface AboutProps {
  info: BuildInfo;
  opens: number | null;
}

// Technical design §11.3: About shows the channel, version, branch and commit.
export const About = ({ info, opens }: AboutProps) => (
  <section class={styles.card} aria-labelledby="about-heading">
    <h2 id="about-heading">About this build</h2>
    <dl class={styles.facts}>
      <dt>Channel</dt>
      <dd>{info.channel === 'preview' ? 'Preview' : 'Live'}</dd>
      <dt>Version</dt>
      <dd>{info.version}</dd>
      <dt>Branch</dt>
      <dd>{info.branch}</dd>
      <dt>Commit</dt>
      <dd>{info.commit}</dd>
      <dt>Built</dt>
      <dd>{info.builtAt.slice(0, 16).replace('T', ' ')} UTC</dd>
      <dt>Opened here</dt>
      <dd>
        {opens === null ? 'Storage unavailable' : `${opens} ${opens === 1 ? 'time' : 'times'}`}
      </dd>
    </dl>
    <p class={styles.note}>
      Live and preview keep separate records. Opening one never changes the other's count.
    </p>
    <p class={styles.note}>
      On iPhone, an app added to the Home Screen may need to be closed and reopened to pick up an
      update.
    </p>
  </section>
);
