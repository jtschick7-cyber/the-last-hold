import { ages } from '../../content/ages';
import { appSettings, game, version } from '../app/runtime';
import { openSheet } from '../app/sheets';
import { useEffect } from 'preact/hooks';
import { sayAfterEnding, spoken } from '../app/lines';
import { AgeSheet } from '../sheets/AgeSheet';
import styles from '../styles/ui.module.css';
import { BuildList } from './BuildList';
import { PeasantsPanel } from './PeasantsPanel';
import { HoldScene } from '../widgets/HoldScene';
import { HoldGrid } from '../widgets/HoldGrid';
import { ArrangeHoldSheet } from '../sheets/ArrangeHoldSheet';
import { litLane } from '../widgets/LanesStrip';
import { buildHoldGridView } from '../../core/systems/layout';
import { ThreatMeter } from '../widgets/ThreatMeter';
import { LongNightView, lastStand } from '../sheets/LongNightSheets';
import { RiftCard } from '../delve/RiftCard';
import { EventsCard } from '../events/EventsCard';
import { eventsCardView } from '../../core/systems/events-view';
import { now } from '../../platform/clock';
import { OrdersCard } from '../orders/OrdersCard';
import { RememberingCard } from '../remembering/RememberingCard';

// GDD §9.2: the hold header (pixel hold scene, via the asset manifest), the
// peasants panel, and the build list.
export const HoldScreen = () => {
  void version.value;
  const s = game();
  const line = spoken.value;
  // GDD §9.21: the badge counts only pieces in the tray.
  const tray = buildHoldGridView(s).tray.length;
  useEffect(sayAfterEnding, []);
  return (
    <div>
      <header class={styles.card}>
        <div style={{ textAlign: 'center' }}>
          {appSettings.value.holdView === 'grid' ? <HoldGrid /> : <HoldScene age={s.cycle.age} />}
        </div>
        <div class={styles.row}>
          <h1
            class={`${styles.grow} ${styles.cardTitle}`}
            style={{
              fontSize: 'calc(1.6rem * var(--text-undo))',
              color: 'var(--c-ember)',
              textTransform: 'none',
            }}
          >
            Stanholm — {ages[s.cycle.age].name}
          </h1>
          <button
            type="button"
            class={styles.btn}
            onClick={() => openSheet('Rank', () => <AgeSheet />)}
          >
            Rank ▸
          </button>
          <button
            type="button"
            class={styles.btn}
            data-layout-button="true"
            data-tray-count={tray}
            onClick={() => {
              litLane.value = null; // a fresh visit lights nothing
              openSheet('Arrange Hold', () => <ArrangeHoldSheet />);
            }}
          >
            {tray > 0 ? `Layout (${tray}) ▸` : 'Layout ▸'}
          </button>
        </div>
        <ThreatMeter />
        {(() => {
          const last = lastStand(s);
          return last && !last.stand.seen ? (
            <button
              type="button"
              class={styles.btnPrimary}
              onClick={() => openSheet('The Long Night', () => <LongNightView />)}
            >
              The Long Night: what happened ▸
            </button>
          ) : null;
        })()}
        {line && (
          <p class={styles.small} key={line.id} aria-live="polite">
            <strong>{line.speaker}:</strong> “{line.text}”
          </p>
        )}
      </header>
      <RiftCard />
      <EventsCard />
      {/* GDD §9.18: after the Events card when it is shown, otherwise after the last card. */}
      {eventsCardView(s, now()) && <OrdersCard />}
      {eventsCardView(s, now()) && <RememberingCard />}
      <PeasantsPanel />
      <BuildList />
      {!eventsCardView(s, now()) && <OrdersCard />}
      {!eventsCardView(s, now()) && <RememberingCard />}
    </div>
  );
};
