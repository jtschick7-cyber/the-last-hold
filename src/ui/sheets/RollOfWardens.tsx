import { useState } from 'preact/hooks';
import { ages } from '../../content/ages';
import { rollMarkText } from '../../content/text/remembering';
import { relics } from '../../content/relics';
import { bandLabels, keepingTheHearth, wornFirstLine } from '../../content/story/scenes';
import { formatNumber } from '../../core/format';
import { rollOfWardens, type WardenLine } from '../../core/story/wardens';
import { dispatch, game, version } from '../app/runtime';
import { openSheet } from '../app/sheets';
import styles from '../styles/ui.module.css';
import { WardenNameField } from '../widgets/WardenNameField';
import { StandResultView } from './LongNightSheets';

// GDD §5.14.5, §9.14 (D153): the Roll of Wardens, in the Hearth Hall below The Hearth:
// the worn first line, then one line per warden. Tapping a line shows that cycle's stand;
// names can be changed here.

const lineText = (l: WardenLine): string => {
  const years = `years ${l.fromYear}–${l.toYear}`;
  const ranks = l.ranks.map((a) => ages[a].name).join(', ');
  const stand = l.stand
    ? `${bandLabels[l.stand.band]}, ${formatNumber(l.stand.waves)} waves`
    : null;
  const relicList = l.relics.map((r) => relics[r].name).join(', ');
  return [
    l.current ? keepingTheHearth : years,
    ranks === '' ? null : `Ranks: ${ranks}`,
    stand ? `Stand: ${stand}` : null,
    relicList === '' ? null : `Relics: ${relicList}`,
  ]
    .filter((x) => x !== null)
    .join(' · ');
};

// A small lamp, drawn in code (lore §34.7), with the line beside it.
const ReadAloudMark = () => (
  <span class={styles.small} title={rollMarkText}>
    {' '}
    <svg width="12" height="14" viewBox="0 0 12 14" aria-hidden="true">
      <rect x="3" y="7" width="6" height="6" fill="currentColor" />
      <rect x="2" y="12" width="8" height="2" fill="currentColor" />
      <rect x="5" y="2" width="2" height="4" fill="var(--c-ember)" />
    </svg>{' '}
    <em>{rollMarkText}</em>
  </span>
);

const WardenRow = ({ l }: { l: WardenLine }) => {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(l.named ? l.name : '');
  const standCycle = game().cycles.find((c) => c.number === l.cycle)?.stand ?? null;
  return (
    <li class={styles.divider}>
      <strong class={l.named ? undefined : styles.dim}>{l.name}</strong>
      {l.readAloud && <ReadAloudMark />}
      <br />
      <span class={`${styles.small} ${styles.dim}`}>{lineText(l)}</span>
      {editing ? (
        <div>
          <WardenNameField
            label="Carved name"
            value={name}
            onChange={(v) => {
              setName(v);
              dispatch({ type: 'warden.name', cycle: l.cycle, name: v });
            }}
          />
          <button type="button" class={styles.btn} onClick={() => setEditing(false)}>
            Done
          </button>
        </div>
      ) : (
        <div class={styles.row} style={{ flexWrap: 'wrap' }}>
          <button type="button" class={styles.btn} onClick={() => setEditing(true)}>
            Rename
          </button>
          {standCycle && (
            <button
              type="button"
              class={styles.btn}
              onClick={() =>
                openSheet(`${l.name}'s stand`, () => <StandResultView stand={standCycle} />)
              }
            >
              The stand
            </button>
          )}
        </div>
      )}
    </li>
  );
};

export const RollOfWardens = () => {
  void version.value;
  const lines = rollOfWardens(game());
  return (
    <div class={styles.card} style={{ marginTop: 'var(--space-3)' }}>
      <h3 class={styles.cardTitle}>Roll of Wardens</h3>
      <p class={`${styles.small} ${styles.dim}`}>
        <em>{wornFirstLine}</em>
      </p>
      <ul class={styles.list}>
        {lines.map((l) => (
          <WardenRow key={l.cycle} l={l} />
        ))}
      </ul>
    </div>
  );
};
