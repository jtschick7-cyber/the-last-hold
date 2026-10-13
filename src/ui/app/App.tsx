import { signal } from '@preact/signals';
import { useEffect } from 'preact/hooks';
import { buildInfo } from '../../platform/build-info';
import type { UpdateHandle } from '../../platform/service-worker';
import { ContractsScreen } from '../screens/ContractsScreen';
import { HoldScreen } from '../screens/HoldScreen';
import { HuntersScreen } from '../screens/HuntersScreen';
import { MoreScreen } from '../screens/MoreScreen';
import { InstallSheet } from '../more/InfoSheets';
import { AwayView } from '../sheets/AwaySheet';
import styles from '../styles/ui.module.css';
import { ResourceBar } from '../widgets/ResourceBar';
import { SheetHost } from '../widgets/SheetHost';
import css from './App.module.css';
import {
  awaySummary,
  blocked,
  catchUpProgress,
  currentScreen,
  dismissInstallTip,
  game,
  installTipDue,
  loadNotes,
  saveNow,
  savingUnavailable,
  version,
} from './runtime';
import { ErrorBoundary } from './ErrorBoundary';
import { openSheet } from './sheets';
import { UpdateBanner } from './UpdateBanner';

export const pendingUpdate = signal<UpdateHandle | null>(null);

// GDD §9.1: a tab appears only when its system unlocks. Contracts and Hunters
// arrive with the first Mine (GDD §5.4.1).
const ALL_TABS = ['hold', 'contracts', 'hunters', 'more'] as const;
type Tab = (typeof ALL_TABS)[number];
const tab = signal<Tab>('hold');
const TAB_LABEL: Record<Tab, string> = {
  hold: 'Hold',
  contracts: 'Contracts',
  hunters: 'Hunters',
  more: 'More',
};
const tabsFor = (opened: boolean): readonly Tab[] =>
  ALL_TABS.filter((t) => opened || (t !== 'contracts' && t !== 'hunters'));
const SCREENS: Record<Tab, () => preact.JSX.Element> = {
  hold: () => <HoldScreen />,
  contracts: () => <ContractsScreen />,
  hunters: () => <HuntersScreen />,
  more: () => <MoreScreen />,
};

const Ribbon = () =>
  buildInfo.channel === 'preview' ? (
    <div class={css.ribbon} aria-label="Preview build">
      PREVIEW
    </div>
  ) : null;

const Notices = () => (
  <>
    {installTipDue.value && (
      <div class={css.notice}>
        <p>
          <strong>Tip:</strong> install the game before you play, so your save stays safe. On iPhone
          the installed app keeps its own storage, separate from Safari.
        </p>
        <button
          type="button"
          class={styles.btn}
          onClick={() => {
            dismissInstallTip();
            openSheet('Install the game', () => <InstallSheet />);
          }}
        >
          How?
        </button>{' '}
        <button type="button" class={styles.btn} onClick={dismissInstallTip}>
          Got it
        </button>
      </div>
    )}
    {savingUnavailable.value && (
      <p class={css.notice}>Saving isn't working in this browser. Export a save code often.</p>
    )}
    {loadNotes.value.length > 0 && (
      <div class={css.notice}>
        {loadNotes.value.map((n) => (
          <p key={n}>{n}</p>
        ))}
        <button type="button" class={styles.btn} onClick={() => (loadNotes.value = [])}>
          OK
        </button>
      </div>
    )}
  </>
);

export const App = () => {
  useEffect(() => {
    document.documentElement.dataset.channel = buildInfo.channel;
  }, []);

  // The away sheet opens once per summary (GDD §9.3).
  useEffect(() => {
    const summary = awaySummary.value;
    if (!summary) return;
    awaySummary.value = null;
    openSheet('While you were away', () => <AwayView summary={summary} />);
  }, [awaySummary.value]);

  useEffect(() => {
    if (version.value === 0) return;
    const { theme, reduceMotion } = game().settings;
    document.documentElement.dataset.theme = theme;
    document.documentElement.dataset.motion = reduceMotion;
  }, [version.value]);

  useEffect(() => {
    currentScreen.value = tab.value;
  }, [tab.value]);

  if (blocked.value) {
    return (
      <main class={css.main}>
        <Ribbon />
        <h1>The Last Hold</h1>
        <p>{blocked.value}</p>
      </main>
    );
  }
  if (version.value === 0) return <main class={css.main}>Lighting the hearth…</main>;

  const progress = catchUpProgress.value;
  const shown = tabsFor(game().board.opened);
  const unread = game().results.length;
  return (
    <div class={css.app}>
      <Ribbon />
      <ResourceBar />
      <main class={css.main}>
        <Notices />
        <ErrorBoundary>{SCREENS[shown.includes(tab.value) ? tab.value : 'hold']()}</ErrorBoundary>
      </main>
      <nav class={css.tabs} aria-label="Screens">
        {shown.map((t) => (
          <button
            type="button"
            key={t}
            class={tab.value === t ? css.tabOn : css.tab}
            aria-current={tab.value === t ? 'page' : undefined}
            onClick={() => (tab.value = t)}
          >
            {TAB_LABEL[t]}
            {t === 'contracts' && unread > 0 ? ` (${unread})` : ''}
          </button>
        ))}
      </nav>
      <ErrorBoundary>
        <SheetHost />
      </ErrorBoundary>
      {progress && (
        <div class={css.catchUp} role="status">
          Catching up… {Math.round((progress.done / progress.total) * 100)}%
        </div>
      )}
      {pendingUpdate.value && (
        <UpdateBanner
          update={pendingUpdate.value}
          beforeReload={() => {
            saveNow();
          }}
        />
      )}
    </div>
  );
};
