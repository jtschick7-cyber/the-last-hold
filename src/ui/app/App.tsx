import { signal } from '@preact/signals';
import { useEffect } from 'preact/hooks';
import { buildInfo } from '../../platform/build-info';
import type { UpdateHandle } from '../../platform/service-worker';
import { archiveTab } from '../../core/story/archive';
import { riftCardView } from '../../core/delves/view';
import { ordersBadge } from '../../core/systems/orders-view';
import { eventsCardView } from '../../core/systems/events-view';
import { now } from '../../platform/clock';
import { ArchiveScreen } from '../screens/ArchiveScreen';
import { BestiaryScreen } from '../screens/BestiaryScreen';
import { ContractsScreen } from '../screens/ContractsScreen';
import { HoldScreen } from '../screens/HoldScreen';
import { HuntersScreen } from '../screens/HuntersScreen';
import { MoreScreen } from '../screens/MoreScreen';
import { InstallSheet } from '../more/InfoSheets';
import { ArrivalView } from '../sheets/ArrivalView';
import { actThreeDue } from '../../core/story/act3';
import { actDue } from '../../core/story/act-start';
import { ActArrivalView } from '../sheets/ActArrivalView';
import { ActThreeArrivalView } from '../sheets/ActThreeArrivalView';
import { V05ArrivalView } from '../sheets/V05ArrivalView';
import { AwayView } from '../sheets/AwaySheet';
import styles from '../styles/ui.module.css';
import { ResourceBar } from '../widgets/ResourceBar';
import { SheetHost } from '../widgets/SheetHost';
import css from './App.module.css';
import {
  appSettings,
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
  tab,
  TABS,
  type Tab,
  version,
} from './runtime';
import { ErrorBoundary } from './ErrorBoundary';
import { playScenes } from './scenes';
import { openSheet, sheets } from './sheets';
import { UpdateBanner } from './UpdateBanner';

export const pendingUpdate = signal<UpdateHandle | null>(null);

// GDD §9.1: a tab appears only when its system unlocks. Contracts and Hunters
// arrive with the first Mine (GDD §5.4.1).
const ALL_TABS = TABS;
const TAB_LABEL: Record<Tab, string> = {
  hold: 'Hold',
  contracts: 'Contracts',
  hunters: 'Hunters',
  bestiary: 'Bestiary',
  more: 'More',
};
// The Bestiary appears with the first species the player has seen (GDD §9.1, §5.6.2).
const tabsFor = (opened: boolean, seen: boolean): readonly Tab[] =>
  ALL_TABS.filter(
    (t) => (opened || (t !== 'contracts' && t !== 'hunters')) && (seen || t !== 'bestiary'),
  );
const SCREENS: Record<Tab, () => preact.JSX.Element> = {
  hold: () => <HoldScreen />,
  contracts: () => <ContractsScreen />,
  hunters: () => <HuntersScreen />,
  // GDD §5.14.3 (D150): the Bestiary tab becomes the Archive once Ilse arrives.
  bestiary: () => (archiveTab(game()).open ? <ArchiveScreen /> : <BestiaryScreen />),
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

  // GDD §9.20: Text size is applied once, at the root; the CSS does the rest.
  useEffect(() => {
    document.documentElement.dataset.textSize = appSettings.value.textSize;
  }, [appSettings.value.textSize]);

  // Scenes play once, when their moment comes (setting-primer §6.6); not during the arrival.
  useEffect(() => {
    if (version.value === 0) return;
    const g = game();
    if (!g.arrivalDue && !g.story.arrivalDue && !actThreeDue(g) && actDue(g) === null) playScenes();
  }, [version.value, sheets.value.length, tab.value]);

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
  // GDD §5.9.8: while the v0.4 arrival is due, it takes the Hold's place; only More stays.
  const arrival = game().arrivalDue;
  // GDD §5.14.1: then, for a save from before v0.5, Ilse's arrival does the same.
  const meetIlse = !arrival && game().story.arrivalDue;
  // GDD §5.14.1 (D214): a save in a cycle that began Act III unwritten meets Arvid on load.
  const meetArvid = !arrival && !meetIlse && actThreeDue(game());
  // GDD §5.14.1 (D246, D302): likewise a save re-based onto Act IV or Act V meets Pechko on load.
  const dueAct = !arrival && !meetIlse && !meetArvid ? actDue(game()) : null;
  const meetPechko = dueAct !== null;
  const shown: readonly Tab[] =
    arrival || meetIlse || meetArvid || meetPechko
      ? ['hold', 'more']
      : tabsFor(
          game().board.opened,
          Object.keys(game().bestiary).length > 0 || game().story.ilseAt !== null,
        );
  const screen = shown.includes(tab.value) ? tab.value : 'hold';
  const unread = game().results.length;
  const archive = archiveTab(game());
  return (
    <div class={css.app}>
      <Ribbon />
      <ResourceBar />
      <main class={css.main}>
        <Notices />
        <ErrorBoundary>
          {arrival && screen === 'hold' ? (
            <ArrivalView />
          ) : meetIlse && screen === 'hold' ? (
            <V05ArrivalView />
          ) : meetArvid && screen === 'hold' ? (
            <ActThreeArrivalView />
          ) : meetPechko && screen === 'hold' ? (
            <ActArrivalView act={dueAct ?? 4} />
          ) : (
            SCREENS[screen]()
          )}
        </ErrorBoundary>
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
            {t === 'bestiary' && archive.open ? 'Archive' : TAB_LABEL[t]}
            {t === 'contracts' && unread > 0 ? ` (${unread})` : ''}
            {/* One badge on the tab however many cards want it (GDD §9.17). */}
            {t === 'hold' &&
            (riftCardView(game())?.badge ||
              eventsCardView(game(), now())?.badge ||
              ordersBadge(game()))
              ? ' ●'
              : ''}
            {t === 'bestiary' && archive.open && archive.unread > 0 ? ` (${archive.unread})` : ''}
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
