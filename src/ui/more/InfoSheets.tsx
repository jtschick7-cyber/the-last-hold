import { buildCredits } from '../../core/credits';
import { formatDuration } from '../../core/format';
import { buildInfo } from '../../platform/build-info';
import { About } from '../app/About';
import { game, reports, version } from '../app/runtime';
import { AwayView } from '../sheets/AwaySheet';
import styles from '../styles/ui.module.css';

export const ReportsSheet = () => {
  const list = reports()?.read() ?? [];
  if (list.length === 0)
    return <p class={styles.dim}>No reports yet. They appear after you've been away a while.</p>;
  return (
    <div>
      {list.map((r) => (
        <section key={r.at} class={styles.card}>
          <h3 class={styles.cardTitle}>{new Date(r.at).toLocaleString()}</h3>
          <AwayView summary={r.summary} />
        </section>
      ))}
    </div>
  );
};

// Technical design §9.1: install before playing; the Home Screen app keeps its
// own storage, separate from Safari; the export code is the real safety net.
export const InstallSheet = () => (
  <div>
    <p>
      <strong>Install the game before you start playing.</strong> On iPhone: open it in Safari, tap
      Share, then “Add to Home Screen”. On Android: open the browser menu and choose “Install app”.
    </p>
    <p>
      On iPhone, the Home Screen app keeps its <strong>own storage, separate from Safari</strong>. A
      game started in Safari won't appear in the installed app. To move it, use More → Save & Data →
      Copy save code, then Import code in the app.
    </p>
    <p>
      Safari can clear storage for websites that go unused for a week; installed apps are much
      safer. The save code is the real safety net: copy one now and then.
    </p>
    <p class={styles.dim}>The game works offline once it has loaded.</p>
  </div>
);

export const AboutSheet = () => {
  void version.value;
  return (
    <div>
      <About info={buildInfo} />
      <section class={styles.card}>
        <h3 class={styles.cardTitle}>This save</h3>
        <p>
          Started {formatDuration((Date.now() - game().meta.createdAt) / 1000)} ago.
          {game().meta.debugUsed ? ' Debug tools have been used on this save.' : ''}
        </p>
      </section>
      <section class={styles.card}>
        <h3 class={styles.cardTitle}>Credits</h3>
        <pre
          class={styles.small}
          style={{
            whiteSpace: 'pre-wrap',
            overflowWrap: 'anywhere',
            fontFamily: 'inherit',
            margin: 0,
          }}
        >
          {buildCredits()
            .split('\n')
            .filter((l) => !l.startsWith('# ') && !l.startsWith('<!--'))
            .join('\n')
            .replaceAll('**', '')
            .replaceAll('## ', '')
            .trim()}
        </pre>
      </section>
    </div>
  );
};
