import { useState } from 'preact/hooks';
import type { GearSlot } from '../../content/gear';
import type { HunterId } from '../../content/hunters';
import { RESOURCE_IDS, type ResourceId } from '../../content/resources';
import { keepsakeIconId } from '../../content/assets';
import { formatNumber } from '../../core/format';
import {
  keepsakeOptions,
  slotPicker,
  type ItemView,
  type Priced,
} from '../../core/systems/slot-picker';
import { dispatch, game, version } from '../app/runtime';
import styles from '../styles/ui.module.css';
import { ItemIcon } from '../widgets/ItemIcon';
import { Sprite } from '../widgets/Sprite';
import { ResourceIcon } from '../widgets/ResourceIcon';

// GDD §9.16 (v0.8, D326): the slot picker (Stores items that fit, best first, each with what it
// changes against what is worn; Craft and Rework with costs) and the keepsake picker. The data and
// every reason come from core/systems/slot-picker.ts.

export const Cost = ({ cost }: { cost: Readonly<Record<ResourceId, number>> }) => {
  const s = game();
  return (
    <span class={styles.cost}>
      {RESOURCE_IDS.filter((r) => cost[r] > 0).map((r) => (
        <span key={r} class={s.resources[r] >= cost[r] ? undefined : styles.short}>
          <ResourceIcon r={r} /> {formatNumber(cost[r])}
        </span>
      ))}
    </span>
  );
};

/** An item's name, base numbers and lines. The rarity frames are the art task (T8.14). */
export const ItemLines = ({ item }: { item: ItemView }) => (
  <div class={styles.row}>
    <ItemIcon gear={item.gear} rarity={item.rarity} />
    <div>
      <strong>{item.name}</strong>
      <div class={`${styles.small} ${styles.dim}`}>{item.base}</div>
      {item.lines.map((l) => (
        <div key={l} class={styles.small}>
          {l}
        </div>
      ))}
    </div>
  </div>
);

const Action = ({
  verb,
  what,
  cost,
  reason,
  onClick,
}: {
  verb: string;
  what: string;
  cost: Priced['cost'];
  reason: string | null;
  onClick: () => void;
}) => (
  <div class={styles.row}>
    <span class={styles.grow}>
      {verb} <strong>{what}</strong> <Cost cost={cost} />
      {reason && <div class={`${styles.small} ${styles.dim}`}>{reason}</div>}
    </span>
    <button
      type="button"
      class={reason === null ? styles.btnPrimary : styles.btn}
      disabled={reason !== null}
      onClick={onClick}
    >
      {verb}
    </button>
  </div>
);

export const SlotPickerSheet = ({ id, slot }: { id: HunterId; slot: GearSlot }) => {
  void version.value;
  const view = slotPicker(game(), id, slot);
  const [note, setNote] = useState<string | null>(null);
  if (!view) return null;
  const go = (cmd: Parameters<typeof dispatch>[0]): void => {
    const r = dispatch(cmd);
    setNote(r.ok ? null : r.reason);
  };
  return (
    <div>
      <p class={styles.small}>Now worn:</p>
      {view.worn ? <ItemLines item={view.worn} /> : <p class={styles.dim}>Nothing.</p>}
      {view.worn && (
        <button
          type="button"
          class={styles.btn}
          disabled={view.takeOff !== null}
          onClick={() => go({ type: 'item.unequip', hunter: id, slot })}
        >
          Take off
        </button>
      )}
      {view.takeOff && <p class={`${styles.small} ${styles.dim}`}>{view.takeOff}</p>}
      <h3 class={styles.cardTitle}>In Stores</h3>
      {view.options.length === 0 && (
        <p class={`${styles.small} ${styles.dim}`}>Nothing in Stores fits this slot.</p>
      )}
      <ul class={styles.list}>
        {view.options.map((o) => (
          <li key={o.item.id} class={`${styles.row} ${styles.divider}`}>
            <span class={styles.grow}>
              <ItemLines item={o.item} />
              <div class={`${styles.small} ${o.delta.length ? styles.good : styles.dim}`}>
                {o.delta.length ? o.delta.join(', ') : 'No difference'}
              </div>
              {o.reason && <div class={`${styles.small} ${styles.dim}`}>{o.reason}</div>}
            </span>
            <button
              type="button"
              class={o.reason === null ? styles.btnPrimary : styles.btn}
              disabled={o.reason !== null}
              onClick={() => go({ type: 'item.equip', item: o.item.id, hunter: id })}
            >
              Wear
            </button>
          </li>
        ))}
      </ul>
      <h3 class={styles.cardTitle}>The Smithy</h3>
      {view.craft && (
        <Action
          verb="Craft"
          what={view.craft.name}
          cost={view.craft.cost}
          reason={view.craft.reason}
          onClick={() => go({ type: 'item.craft', base: view.craft?.base ?? '' })}
        />
      )}
      {view.rework && (
        <Action
          verb="Rework"
          what={view.rework.name === '' ? '(the best there is)' : `to ${view.rework.name}`}
          cost={view.rework.cost}
          reason={view.rework.reason}
          onClick={() => go({ type: 'item.rework', item: view.rework?.item ?? '' })}
        />
      )}
      {note && <p class={`${styles.small} ${styles.warn}`}>{note}</p>}
    </div>
  );
};

export const KeepsakePickerSheet = ({ id }: { id: HunterId }) => {
  void version.value;
  const [note, setNote] = useState<string | null>(null);
  const options = keepsakeOptions(game(), id);
  const go = (cmd: Parameters<typeof dispatch>[0]): void => {
    const r = dispatch(cmd);
    setNote(r.ok ? null : r.reason);
  };
  return (
    <div>
      <ul class={styles.list}>
        {options.map((o) => (
          <li key={o.id} class={`${styles.row} ${styles.divider} ${o.found ? '' : styles.dim}`}>
            <Sprite id={keepsakeIconId(o.id)} scale={2} />
            <span class={styles.grow}>
              <strong>{o.name}</strong>
              <div class={`${styles.small} ${styles.dim}`}>
                {o.found ? o.text : `Found when: ${o.foundText}`}
              </div>
              {o.wornBy && !o.worn && (
                <div class={`${styles.small} ${styles.dim}`}>Worn by {o.wornBy}.</div>
              )}
              {o.reason && o.found && !o.wornBy && (
                <div class={`${styles.small} ${styles.dim}`}>{o.reason}</div>
              )}
            </span>
            {o.worn ? (
              <button
                type="button"
                class={styles.btn}
                onClick={() => go({ type: 'keepsake.unequip', hunter: id })}
              >
                Take off
              </button>
            ) : (
              <button
                type="button"
                class={o.reason === null ? styles.btnPrimary : styles.btn}
                disabled={o.reason !== null}
                onClick={() => go({ type: 'keepsake.equip', hunter: id, legendary: o.id })}
              >
                Wear
              </button>
            )}
          </li>
        ))}
      </ul>
      {note && <p class={`${styles.small} ${styles.warn}`}>{note}</p>}
    </div>
  );
};
