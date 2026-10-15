import type { ComponentChildren } from 'preact';
import type { Command } from '../../core/commands/types';
import { dispatch } from '../app/runtime';
import { openSheet } from '../app/sheets';
import styles from '../styles/ui.module.css';

// GDD §5.14.1 (D214, D246, D302): a save that missed an act's opening meets it on load. The card
// takes the Hold screen's place until its button is used; More stays open (to export the save
// first). One card for Arvid (Act III) and Pechko (Acts IV and V), so they behave the same way.
export const OnLoadCard = ({
  title,
  line,
  button,
  command,
  sheet,
  children,
}: {
  title: string;
  line: string;
  button: string;
  command: Command;
  sheet: string;
  children: ComponentChildren;
}) => (
  <div class={styles.card}>
    <h2 class={styles.cardTitle}>{title}</h2>
    <p>{line}</p>
    <button
      type="button"
      class={styles.btnPrimary}
      style={{ width: '100%' }}
      onClick={() => {
        if (!dispatch(command).ok) return;
        openSheet(sheet, () => children);
      }}
    >
      {button}
    </button>
  </div>
);
