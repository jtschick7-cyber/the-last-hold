import { useEffect, useState } from 'preact/hooks';
import { DESCENT_STRINGS } from '../../content/descent-text';
import type { DescentStagePlayback } from '../../core/systems/descent-playback';
import { lastDescentView } from '../../core/systems/descent-playback';
import { dispatch, game } from '../app/runtime';
import { openSheet } from '../app/sheets';
import { playSoundById } from '../app/sound';
import { PlaybackLog, PlaybackView } from '../delve/PlaybackView';
import styles from '../styles/ui.module.css';

// GDD §9.24 (S4, S9), plan TD.7b: the Descent's playback. Story card → stage fight → story card → ... →
// the ending card(s) → the result sheet. The whole attempt was fought by `descent.start`; this only shows
// it, rebuilt from the saved record. Closing the sheet early leaves the result unread, and the card then
// offers "View Descent result". Sound (UI-only, D567 (6)): clearing Stage 1 or 2 plays `win`, beating
// Stage 3 plays `fanfare`, losing plays `lose`; the story cards are silent.

type Last = NonNullable<ReturnType<typeof lastDescentView>>;

const openStageLog = (s: DescentStagePlayback): void =>
  openSheet(s.logLabel, () => <PlaybackLog pb={s} />);

const ResultView = ({ view }: { view: Last }) => {
  const r = view.playback.result;
  // Reaching the result sheet counts as seeing it (S9).
  useEffect(() => {
    dispatch({ type: 'descent.markRead' });
  }, []);
  return (
    <div data-testid="descent-result">
      <h3 class={styles.cardTitle}>{r.heading}</h3>
      <p>{r.summary}</p>
      <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
        {view.playback.stages.map((s) => (
          <button
            key={s.stage}
            type="button"
            class={styles.btn}
            data-testid={`descent-log-${s.stage}`}
            onClick={() => openStageLog(s)}
          >
            {s.logLabel}
          </button>
        ))}
      </div>
    </div>
  );
};

// `progress` lives outside the component: a sheet opened over this one (a log) hides it, and it must come back where it was.
const Flow = ({ view, progress }: { view: Last; progress: { at: number } }) => {
  const beats = view.playback.beats;
  const [i, setI] = useState(progress.at);
  const beat = beats[i];
  const next = (): void => {
    progress.at = i + 1;
    setI(i + 1);
  };
  if (!beat) return <ResultView view={view} />;
  if (beat.kind === 'card')
    return (
      <div data-testid={`descent-card-${beat.card.id}`}>
        {beat.card.paragraphs.map((p) => (
          <p key={p}>{p}</p>
        ))}
        <button type="button" class={styles.btnPrimary} style={{ width: '100%' }} onClick={next}>
          Continue
        </button>
      </div>
    );
  const stage = view.playback.stages.find((s) => s.stage === beat.stage);
  if (!stage) return <ResultView view={view} />;
  return (
    <div data-testid={`descent-stage-play-${stage.stage}`} key={stage.stage}>
      <PlaybackView
        pb={stage}
        banner={stage.banner}
        outcome={null}
        opening=""
        onContinue={next}
        onFinish={() => playSoundById(!stage.won ? 'lose' : stage.stage === 3 ? 'fanfare' : 'win')}
      />
    </div>
  );
};

/** The whole playback, from D-01 (after Start), or the result sheet alone ("View Descent result"). */
export const openDescentPlayback = (resultOnly = false): void => {
  const view = lastDescentView(game());
  if (!view) return;
  const progress = { at: resultOnly ? view.playback.beats.length : 0 };
  openSheet(DESCENT_STRINGS.button, () => <Flow view={view} progress={progress} />);
};
