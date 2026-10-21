import { useEffect, useState } from 'preact/hooks';
import { rememberingReadyNote } from '../../core/story/remembering-view';
import { dispatch, game } from '../app/runtime';
import styles from '../styles/ui.module.css';

// GDD §5.15.2 (D466 (1)): one line on the first away or result sheet after the gate opens, once, only
// after Pechko's scene. The line is read when the sheet opens, so it stays while the sheet is open.
export const ReadyLine = () => {
  const [line] = useState(() => rememberingReadyNote(game()));
  useEffect(() => {
    if (line !== null) dispatch({ type: 'remembering.noteReady' });
  }, [line]);
  return line === null ? null : <p class={styles.small}>{line}</p>;
};
