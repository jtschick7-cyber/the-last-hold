import { useState } from 'preact/hooks';
import { WARDEN_NAME_MAX } from '../../content/story/scenes';
import { suggestWardenName } from '../../core/story/wardens';
import { game } from '../app/runtime';
import styles from '../styles/ui.module.css';

// GDD §5.14.5, §9.14 (D152): a name up to 24 characters, with Suggest. `taken` holds
// what the other fields on the sheet already say, so Suggest never repeats a name there.
export const WardenNameField = ({
  label,
  value,
  onChange,
  taken = [],
  slot = 0,
}: {
  label: string;
  value: string;
  onChange: (name: string) => void;
  taken?: readonly string[];
  /** Keeps two fields on one sheet from drawing the same first suggestion. */
  slot?: number;
}) => {
  const [presses, setPresses] = useState(0);
  return (
    <label style={{ display: 'block', marginBottom: 'var(--space-2)' }}>
      <span class={styles.small}>{label}</span>
      <span class={styles.row}>
        <input
          type="text"
          class={styles.textField}
          value={value}
          maxLength={WARDEN_NAME_MAX}
          onInput={(e) => onChange(e.currentTarget.value)}
        />
        <button
          type="button"
          class={styles.btn}
          onClick={() => {
            onChange(suggestWardenName(game(), slot * 1000 + presses, taken));
            setPresses(presses + 1);
          }}
        >
          Suggest
        </button>
      </span>
    </label>
  );
};
