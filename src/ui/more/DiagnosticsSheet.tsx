import { useState } from 'preact/hooks';
import { encodeSaveCode, makeEnvelope } from '../../core/save';
import { browserCodec } from '../../platform/compression';
import { diagnosticsText } from '../../platform/diagnostics';
import { diagnostics, game } from '../app/runtime';
import styles from '../styles/ui.module.css';

/** Builds the paste-into-a-session text; works even when the game state is broken. */
export const copyDiagnostics = async (): Promise<string> => {
  let code = '(no save code: the game state was unavailable)';
  try {
    code = await encodeSaveCode(makeEnvelope(game(), Date.now()), browserCodec());
  } catch {
    // Keep going: the errors matter more than the code.
  }
  const text = diagnosticsText(diagnostics()?.read() ?? [], code);
  try {
    await navigator.clipboard.writeText(text);
    return 'Diagnostics copied. Paste them into a message for Claude Code.';
  } catch {
    return "Couldn't reach the clipboard.";
  }
};

// Technical design §15.1: More → Diagnostics lists captured errors.
export const DiagnosticsSheet = () => {
  const [note, setNote] = useState<string | null>(null);
  const [errors, setErrors] = useState(diagnostics()?.read() ?? []);
  return (
    <div>
      <div class={styles.row}>
        <button
          type="button"
          class={styles.btnPrimary}
          onClick={async () => setNote(await copyDiagnostics())}
        >
          Copy diagnostics
        </button>
        <button
          type="button"
          class={styles.btn}
          onClick={() => {
            diagnostics()?.clear();
            setErrors([]);
          }}
        >
          Clear
        </button>
      </div>
      {note && <p class={styles.small}>{note}</p>}
      {errors.length === 0 ? (
        <p class={styles.dim}>No errors recorded. Good.</p>
      ) : (
        <ul class={styles.list}>
          {errors.map((e, i) => (
            <li key={i} class={styles.divider} style={{ padding: 'var(--space-2) 0' }}>
              <div class={styles.small}>
                {new Date(e.time).toLocaleString()} · {e.screen}
              </div>
              <div>{e.message}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
