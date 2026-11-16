import { ages } from '../../content/ages';
import { V18_TEXT } from '../../content/v18-text';
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
import { openArrangeHold } from '../sheets/ArrangeHoldSheet';
import { openHoldLook } from '../sheets/HoldLookSheet';
import { buildHoldGridView } from '../../core/systems/layout';
import { ThreatMeter } from '../widgets/ThreatMeter';
import { LongNightView, lastStand } from '../sheets/LongNightSheets';
import { RiftCard } from '../delve/RiftCard';
import { EventsCard } from '../events/EventsCard';
import { eventsCardView } from '../../core/systems/events-view';
import { now } from '../../platform/clock';
import { OrdersCard } from '../orders/OrdersCard';
import { RememberingCard } from '../remembering/RememberingCard';

export const threatTier = (threat: number): 'calm' | 'warning' | 'elevated' | 'dire' => {
  if (threat >= 75) return 'dire';
  if (threat >= 40) return 'elevated';
  if (threat >= 15) return 'warning';
  return 'calm';
};

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
        <div class={styles.holdSky} data-threat={threatTier(s.threat)}>
          {appSettings.value.holdView === 'grid' ? <HoldGrid /> : <HoldScene age={s.cycle.age} />}
        </div>
        <h1
          class={styles.cardTitle}
          style={{
            fontSize: 'calc(1.6rem * var(--text-undo))',
            color: 'var(--c-ember)',
            textTransform: 'none',
          }}
        >
          Stanholm — {ages[s.cycle.age].name}
        </h1>
        <div
          class={styles.row}
          data-hold-actions="true"
          style={{ gap: 'var(--space-1)', marginBottom: 'var(--space-2)' }}
        >
          <button
            type="button"
            class={styles.btn}
            style={{ flex: '1 1 auto', padding: 'var(--space-1) 0.375rem' }}
            onClick={() => openSheet('Rank', () => <AgeSheet />)}
          >
            Rank ▸
          </button>
          <button
            type="button"
            class={styles.btn}
            style={{ flex: '1 1 auto', padding: 'var(--space-1) 0.375rem' }}
            data-layout-button="true"
            data-tray-count={tray}
            onClick={openArrangeHold}
          >
            {tray > 0 ? `Layout (${tray}) ▸` : 'Layout ▸'}
          </button>
          <button
            type="button"
            class={styles.btn}
            style={{ flex: '1 1 auto', padding: 'var(--space-1) 0.375rem' }}
            data-hold-look-button="hold"
            onClick={openHoldLook}
          >
            {V18_TEXT.holdLookButton}
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
