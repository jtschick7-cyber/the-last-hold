import {
  CONSUMABLE_IDS,
  consumables,
  type ConsumableId,
  type ConsumableKind,
} from '../../content/consumables';
import { hunters, type HunterId } from '../../content/hunters';
import { num } from '../../core/balance-access';
import { bombIsWeak, isWellPrepared, prepCounts } from '../../core/contracts/prep';
import type { ContractIdentity } from '../../core/investigation/view';
import type { GameState, Preparation } from '../../core/state/game-state';
import { skillLevel } from '../../core/skills/skills';
import { oilNote } from '../app/knowledge-text';
import styles from '../styles/ui.module.css';

// GDD §5.7, §9.5: one oil and one potion per hunter, up to two bombs per party.
// Anything the stores can't cover is greyed out. An oil says what it does against this
// contract, or against each candidate while the monster is unidentified.

type Slot = { kind: 'oil' | 'potion'; hunter: HunterId } | { kind: 'bomb'; index: number };

const current = (prep: Preparation, slot: Slot): ConsumableId | '' =>
  slot.kind === 'bomb'
    ? (prep.bombs[slot.index] ?? '')
    : ((slot.kind === 'oil' ? prep.oils : prep.potions)[slot.hunter] ?? '');

const withSlot = (prep: Preparation, slot: Slot, item: ConsumableId | ''): Preparation => {
  if (slot.kind === 'bomb') {
    const bombs = [...prep.bombs];
    if (item === '') bombs.splice(slot.index, 1);
    else bombs[slot.index] = item;
    return { ...prep, bombs: bombs.filter(Boolean) };
  }
  const key = slot.kind === 'oil' ? 'oils' : 'potions';
  const rest = Object.fromEntries(Object.entries(prep[key]).filter(([h]) => h !== slot.hunter));
  return { ...prep, [key]: item === '' ? rest : { ...rest, [slot.hunter]: item } };
};

const Select = ({
  state,
  prep,
  slot,
  label,
  onChange,
}: {
  state: GameState;
  prep: Preparation;
  slot: Slot;
  label: string;
  onChange: (p: Preparation) => void;
}) => {
  const used = prepCounts(prep);
  const mine = current(prep, slot);
  const options = CONSUMABLE_IDS.filter((id) => consumables[id].kind === slot.kind);
  return (
    <label class={styles.row}>
      <span style={{ minWidth: '4.5rem' }} class={styles.small}>
        {label}
      </span>
      <select
        class={styles.grow}
        style={{ minHeight: '44px' }}
        value={mine}
        onChange={(e) =>
          onChange(withSlot(prep, slot, (e.currentTarget.value || '') as ConsumableId | ''))
        }
      >
        <option value="">—</option>
        {options.map((id) => {
          const left = state.stores[id] - (used.get(id) ?? 0) + (id === mine ? 1 : 0);
          return (
            <option key={id} value={id} disabled={left <= 0}>
              {consumables[id].name} ×{Math.max(0, left)}
            </option>
          );
        })}
      </select>
    </label>
  );
};

export const PreparationPicker = ({
  state,
  party,
  prep,
  identity,
  onChange,
}: {
  state: GameState;
  party: readonly HunterId[];
  prep: Preparation;
  identity: ContractIdentity;
  onChange: (p: Preparation) => void;
}) => {
  const stocked = (kind: ConsumableKind): boolean =>
    CONSUMABLE_IDS.some((id) => consumables[id].kind === kind && state.stores[id] > 0);
  const anyStock = (['oil', 'potion', 'bomb'] as const).some(stocked) || prepCounts(prep).size > 0;
  if (!anyStock) {
    return (
      <p class={`${styles.small} ${styles.dim}`}>
        Nothing prepared. Oils, potions and bombs are brewed in the Alchemist's Hut.
      </p>
    );
  }
  const oils = Object.values(prep.oils);
  const bombSlots = num('prep.bombSlots');
  const wellPrepared =
    identity.identified && identity.monster
      ? isWellPrepared(identity.monster, prep, prep.bombs.includes('saltburst'))
      : false;
  return (
    <div>
      <h3 class={styles.cardTitle}>Prepare</h3>
      {party.map((id) => (
        <div key={id}>
          <div class={styles.small}>
            <strong>{hunters[id].shortName}</strong>
          </div>
          <Select
            state={state}
            prep={prep}
            slot={{ kind: 'oil', hunter: id }}
            label="Oil"
            onChange={onChange}
          />
          <Select
            state={state}
            prep={prep}
            slot={{ kind: 'potion', hunter: id }}
            label="Potion"
            onChange={onChange}
          />
        </div>
      ))}
      {Array.from({ length: bombSlots }, (_, i) => (
        <Select
          key={i}
          state={state}
          prep={prep}
          slot={{ kind: 'bomb', index: i }}
          label={`Bomb ${i + 1}`}
          onChange={onChange}
        />
      ))}
      {[...new Set(oils)].map((oil) => (
        <div key={oil} class={`${styles.small} ${styles.dim}`}>
          {oilNote(oil, identity, skillLevel(state, 'alchemy'))}
        </div>
      ))}
      {prep.bombs.map((b, i) => {
        const e = consumables[b].effect;
        const note =
          e.kind === 'saltburst'
            ? 'cancels the monster’s first ability'
            : e.kind === 'smoke'
              ? 'the monster loses its next action'
              : identity.identified && identity.monster
                ? bombIsWeak(b, identity.monster)
                  ? 'weak to it ✔'
                  : 'not especially weak to it'
                : 'weakness depends on what it is';
        return (
          <div key={`${b}${i}`} class={`${styles.small} ${styles.dim}`}>
            {consumables[b].name}: {note}
          </div>
        );
      })}
      {wellPrepared && (
        <div class={`${styles.small} ${styles.good}`}>
          Well prepared: a win pays ×{num('prep.wellPreparedBounty')} bounty and +1 trophy.
        </div>
      )}
    </div>
  );
};
