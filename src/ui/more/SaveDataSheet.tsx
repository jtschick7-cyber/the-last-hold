import { useState } from 'preact/hooks';
import {
  decodeSaveCode,
  decodeSaveFile,
  encodeSaveCode,
  encodeSaveFile,
  makeEnvelope,
  type Validated,
} from '../../core/save';
import type { Result } from '../../core/result';
import { formatDuration } from '../../core/format';
import { now } from '../../platform/clock';
import { browserCodec } from '../../platform/compression';
import { downloadText, saveFileName } from '../../platform/download';
import {
  adoptGame,
  game,
  lastSavedAt,
  resetGame,
  saveNow,
  saveStore,
  version,
} from '../app/runtime';
import { closeAllSheets } from '../app/sheets';
import styles from '../styles/ui.module.css';

// GDD §9.10 Save & Data, technical design §9.3: save now, codes, the save file,
// the backup slot, and a reset behind two confirmations. A failed import never
// touches the current save.
const ago = (t: number | null): string =>
  t === null ? 'not yet' : `${formatDuration((now() - t) / 1000)} ago`;

export const SaveDataSheet = () => {
  void version.value;
  const [code, setCode] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState<Validated | null>(null);
  const [resetStep, setResetStep] = useState(0);
  const backup = saveStore()?.backup() ?? null;

  const offer = (result: Result<Validated>): void => {
    if (!result.ok) {
      setPending(null);
      setMessage(result.error);
      return;
    }
    setPending(result.value);
    setMessage(null);
  };

  const copyCode = async (): Promise<void> => {
    const text = await encodeSaveCode(makeEnvelope(game(), now()), browserCodec());
    setCode(text);
    try {
      await navigator.clipboard.writeText(text);
      setMessage('Save code copied. Keep it somewhere safe.');
    } catch {
      setMessage("Couldn't reach the clipboard. Select the code below and copy it.");
    }
  };

  return (
    <div>
      <p class={styles.dim}>Last saved {ago(lastSavedAt.value)} (auto).</p>
      <div class={styles.row} style={{ flexWrap: 'wrap' }}>
        <button
          type="button"
          class={styles.btn}
          onClick={() => setMessage(saveNow() ? 'Saved.' : "Couldn't save.")}
        >
          Save now
        </button>
        <button type="button" class={styles.btn} onClick={() => void copyCode()}>
          Copy save code
        </button>
        <button
          type="button"
          class={styles.btn}
          onClick={() =>
            downloadText(saveFileName(new Date()), encodeSaveFile(makeEnvelope(game(), now())))
          }
        >
          Download save file
        </button>
        <label class={styles.btn} style={{ display: 'inline-flex', alignItems: 'center' }}>
          Load file
          <input
            type="file"
            accept="application/json,.json"
            class="sr-only"
            onChange={async (e) => {
              // The event's currentTarget is gone after the first await, so keep the input itself.
              const input = e.currentTarget;
              const file = input.files?.[0];
              if (file) offer(decodeSaveFile(await file.text()));
              input.value = '';
            }}
          />
        </label>
      </div>

      <h3 class={styles.cardTitle} style={{ marginTop: 'var(--space-3)' }}>
        Save code
      </h3>
      <textarea
        aria-label="Save code"
        rows={4}
        style={{ width: '100%', font: 'inherit', fontSize: '0.75rem' }}
        value={code}
        onInput={(e) => setCode(e.currentTarget.value)}
        placeholder="Paste a save code here to import it."
      />
      <button
        type="button"
        class={styles.btn}
        disabled={code.trim() === ''}
        onClick={async () => offer(await decodeSaveCode(code, browserCodec()))}
      >
        Import code
      </button>

      {message && <p class={styles.small}>{message}</p>}
      {pending && (
        <div class={styles.card}>
          <p>Replace your current game with this save? Your current game is overwritten.</p>
          {pending.warnings.length > 0 && (
            <ul class={styles.small}>
              {pending.warnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          )}
          <button
            type="button"
            class={styles.btnPrimary}
            onClick={() => {
              const next = pending.state;
              setPending(null);
              closeAllSheets();
              void adoptGame(next);
            }}
          >
            Yes, load it
          </button>{' '}
          <button type="button" class={styles.btn} onClick={() => setPending(null)}>
            Cancel
          </button>
        </div>
      )}

      <h3 class={styles.cardTitle} style={{ marginTop: 'var(--space-3)' }}>
        Backup slot
      </h3>
      <div class={styles.row}>
        <span class={styles.grow}>{backup ? `Saved ${ago(backup.savedAt)}` : 'Empty for now'}</span>
        <button
          type="button"
          class={styles.btn}
          disabled={!backup}
          onClick={() => backup && setPending(backup.loaded)}
        >
          Restore
        </button>
      </div>

      <h3 class={styles.cardTitle} style={{ marginTop: 'var(--space-3)' }}>
        Start over
      </h3>
      {resetStep === 0 && (
        <button type="button" class={styles.btn} onClick={() => setResetStep(1)}>
          Reset everything…
        </button>
      )}
      {resetStep === 1 && (
        <div>
          <p class={styles.warn}>
            This starts a new game. Export a save code first if you might want this one back.
          </p>
          <button type="button" class={styles.btn} onClick={() => setResetStep(2)}>
            I understand
          </button>{' '}
          <button type="button" class={styles.btn} onClick={() => setResetStep(0)}>
            Cancel
          </button>
        </div>
      )}
      {resetStep === 2 && (
        <div>
          <p class={styles.warn}>Last chance. Start over now?</p>
          <button
            type="button"
            class={styles.btnPrimary}
            onClick={() => {
              resetGame();
              closeAllSheets();
            }}
          >
            Yes, start over
          </button>{' '}
          <button type="button" class={styles.btn} onClick={() => setResetStep(0)}>
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};
