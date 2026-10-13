import { useState } from 'preact/hooks';
import { buildingSpriteId } from '../../content/assets';
import { BUILDING_IDS, buildings, type BuildingId } from '../../content/buildings';
import { RESOURCE_IDS } from '../../content/resources';
import { describeBuilding } from '../../core/describe';
import { formatDuration, formatNumber } from '../../core/format';
import type { GameState } from '../../core/state/game-state';
import { isAvailable, maxLevelNow } from '../../core/systems/ages';
import {
  buildingCost,
  canAfford,
  copyLimit,
  maxAffordableCount,
  timeToAfford,
} from '../../core/systems/costs';
import { productionRate } from '../../core/systems/production';
import { bestBuy, payback } from '../../core/systems/valuation';
import { dispatch, game, version } from '../app/runtime';
import { openSheet } from '../app/sheets';
import { HutView } from '../sheets/HutSheet';
import styles from '../styles/ui.module.css';
import { ResourceIcon } from '../widgets/ResourceIcon';
import { Num } from '../widgets/Num';
import { Sprite } from '../widgets/Sprite';

// GDD §9.2 build list: ×1 / ×10 / Max for count buildings, the cost (muted when
// short), "ready in" at current rates, and the ● best-payback hint.
type Mode = 1 | 10 | 'max';
const MODES: readonly Mode[] = [1, 10, 'max'];

const howMany = (s: GameState, id: BuildingId, mode: Mode): number =>
  mode === 'max' ? Math.max(1, maxAffordableCount(s, id)) : mode;

const Row = ({ id, mode, hinted }: { id: BuildingId; mode: Mode; hinted: boolean }) => {
  const s = game();
  const def = buildings[id];
  const owned = s.buildings[id];
  const isLevel = def.kind === 'level';
  const cap = copyLimit(id);
  const atMax = isLevel ? owned >= maxLevelNow(s, id) : cap !== null && owned >= cap;
  const k = isLevel
    ? 1
    : Math.min(howMany(s, id, mode), cap === null ? Infinity : Math.max(1, cap - owned));
  const cost = buildingCost(s, id, k);
  const affordable = canAfford(s, cost.bundle);
  const wait =
    affordable || atMax ? null : timeToAfford(s, cost.bundle, (r) => productionRate(s, r).value);
  const status = isLevel
    ? `Lv ${owned}/${maxLevelNow(s, id)}`
    : `×${owned}${cap !== null ? `/${cap}` : ''}`;
  const act = (): void => {
    dispatch(
      isLevel
        ? { type: 'build.upgrade', building: id }
        : { type: 'build.buy', building: id, count: mode === 'max' ? 'max' : k },
    );
  };
  return (
    <li class={styles.divider} style={{ padding: 'var(--space-2) 0' }}>
      <div class={styles.row}>
        <Sprite id={buildingSpriteId(id)} />
        <span class={styles.grow}>
          <strong>{def.name}</strong> <span class={styles.dim}>{status}</span>
          <br />
          <span class={`${styles.small} ${styles.dim}`}>{describeBuilding(id)}</span>
        </span>
        {hinted && (
          <span class={styles.hint}>
            <Num text="●" breakdown={() => payback(s, id).breakdown} />
          </span>
        )}
        {id === 'alchemists-hut' && owned > 0 && (
          <button
            type="button"
            class={styles.btn}
            onClick={() => openSheet("Alchemist's Hut", () => <HutView />)}
          >
            Open
          </button>
        )}
        <button
          type="button"
          class={affordable && !atMax ? styles.btnPrimary : styles.btn}
          disabled={!affordable || atMax}
          onClick={act}
        >
          {atMax ? 'Max' : isLevel ? 'Upgrade' : k > 1 ? `Buy ×${k}` : 'Buy'}
        </button>
      </div>
      {!atMax && (
        <div class={`${styles.cost} ${styles.small}`}>
          {RESOURCE_IDS.filter((r) => cost.bundle[r] > 0).map((r) => (
            <span key={r} class={s.resources[r] >= cost.bundle[r] ? undefined : styles.short}>
              <ResourceIcon r={r} />
              <Num text={formatNumber(cost.bundle[r])} breakdown={() => cost.breakdown} />
            </span>
          ))}
          {wait !== null && wait > 0 && (
            <span class={styles.dim}>ready in ~{formatDuration(wait)}</span>
          )}
          {!affordable && wait === null && (
            <span class={styles.dim}>needs income you don't have yet</span>
          )}
        </div>
      )}
    </li>
  );
};

export const BuildList = () => {
  void version.value;
  const [mode, setMode] = useState<Mode>(1);
  const s = game();
  const ids = BUILDING_IDS.filter(
    (id) => buildings[id].kind !== 'unique' && isAvailable(s, buildings[id]),
  );
  const best = s.settings.bestBuyHint ? bestBuy(s) : null;
  return (
    <section class={styles.card} aria-labelledby="build-title">
      <div class={styles.row}>
        <h2 id="build-title" class={`${styles.cardTitle} ${styles.grow}`}>
          Build
        </h2>
        <div class={styles.segmented} role="group" aria-label="How many to buy">
          {MODES.map((m) => (
            <button
              type="button"
              key={m}
              class={mode === m ? styles.segmentOn : styles.segment}
              onClick={() => setMode(m)}
            >
              {m === 'max' ? 'Max' : `×${m}`}
            </button>
          ))}
        </div>
      </div>
      <ul class={styles.list}>
        {ids.map((id) => (
          <Row key={id} id={id} mode={mode} hinted={best === id} />
        ))}
      </ul>
      {best && (
        <p class={`${styles.small} ${styles.dim}`}>
          ● best payback right now. Long-press it to see why.
        </p>
      )}
    </section>
  );
};
