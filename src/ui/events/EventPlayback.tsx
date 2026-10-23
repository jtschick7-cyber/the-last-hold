import { useEffect, useMemo, useRef } from 'preact/hooks';
import { lastPlayback } from '../../core/systems/events-playback';
import { unlockView } from '../../core/systems/events-results';
import { PlaybackView } from '../delve/PlaybackView';
import { game } from '../app/runtime';
import { playMoment } from '../app/sound';
import { momentForAttempt } from '../app/sound-cues';
import { closeSheet, openSheet } from '../app/sheets';
import styles from '../styles/ui.module.css';
import { openResult, UnlockSheet } from './ResultSheet';

// GDD §9.17: the attempt plays back like a Delve floor, with Skip and Log. The attempt is already
// worked out (it was applied when the party was sent); this only shows it. Closing the sheet early
// loses nothing: the result stays on the Events card and the boss or hunt sheet.
const EventPlayback = () => {
  const pb = useMemo(() => lastPlayback(game()), []);
  // GDD §9.22: one sound for the attempt, the first time its result is shown: at the end of the
  // playback, or at once if it is skipped or the sheet is closed early. Never again.
  const moment = useMemo(() => momentForAttempt(game().events.last), []);
  const heard = useRef(false);
  const hear = (): void => {
    if (heard.current) return;
    heard.current = true;
    if (moment) playMoment(moment);
  };
  useEffect(() => hear, []);
  if (!pb) return <p class={styles.dim}>Nothing to show.</p>;
  return (
    <PlaybackView
      pb={pb}
      onFinish={hear}
      continueLabel="See the result"
      onContinue={() => {
        closeSheet();
        openResult();
        if (unlockView(game())) openSheet('A hunter joins', () => <UnlockSheet />);
      }}
    />
  );
};

export const startEventPlayback = (): void => {
  const pb = lastPlayback(game());
  openSheet(pb?.title ?? 'The fight', () => <EventPlayback />);
};
