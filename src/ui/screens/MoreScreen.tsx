import type { ComponentChildren } from 'preact';
import { openSheet } from '../app/sheets';
import { DebugSheet, debugEnabled } from '../more/DebugSheet';
import { DiagnosticsSheet } from '../more/DiagnosticsSheet';
import { AboutSheet, InstallSheet, ReportsSheet } from '../more/InfoSheets';
import { SaveDataSheet } from '../more/SaveDataSheet';
import { SettingsSheet } from '../more/SettingsSheet';
import styles from '../styles/ui.module.css';

// GDD §9.10: the More menu. Debug shows only in dev builds or with ?debug.
const items: [string, () => ComponentChildren, () => boolean][] = [
  ['Reports', () => <ReportsSheet />, () => true],
  ['Save & Data', () => <SaveDataSheet />, () => true],
  ['Settings', () => <SettingsSheet />, () => true],
  ['Install the game', () => <InstallSheet />, () => true],
  ['Diagnostics', () => <DiagnosticsSheet />, () => true],
  ['Debug', () => <DebugSheet />, debugEnabled],
  ['About & Credits', () => <AboutSheet />, () => true],
];

export const MoreScreen = () => (
  <ul class={`${styles.list} ${styles.card}`}>
    {items
      .filter(([, , shown]) => shown())
      .map(([label, render]) => (
        <li key={label} class={styles.divider}>
          <button
            type="button"
            class={styles.btn}
            style={{ width: '100%', textAlign: 'left', border: 'none', background: 'none' }}
            onClick={() => openSheet(label, render)}
          >
            {label} ▸
          </button>
        </li>
      ))}
  </ul>
);
