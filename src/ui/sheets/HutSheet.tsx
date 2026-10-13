import { CONSUMABLE_IDS, consumables, type ConsumableId } from '../../content/consumables';
import { INGREDIENT_IDS, ingredients, type IngredientId } from '../../content/ingredients';
import { RESOURCE_IDS } from '../../content/resources';
import { brewSlots, kettlesBusy } from '../../core/alchemy/brewing';
import { gardenCount, nextGardenTime } from '../../core/alchemy/garden';
import { formatDuration } from '../../core/format';
import type { GameState } from '../../core/state/game-state';
import { ingredientName, recipeText } from '../app/knowledge-text';
import { dispatch, game, version } from '../app/runtime';
import styles from '../styles/ui.module.css';

// GDD §9.9: the Alchemist's Hut. What is brewing, what the stores hold, and every
// recipe with a Brew button, muted (with what is missing) when the stores can't cover it.

const missing = (s: GameState, id: ConsumableId): string | null => {
  const r = consumables[id].recipe;
  for (const [k, n] of Object.entries(r.ingredients))
    if (s.stores[k as IngredientId] < (n ?? 0))
      return `needs ${ingredientName(k as IngredientId).toLowerCase()} (have ${s.stores[k as IngredientId]})`;
  for (const k of RESOURCE_IDS) if (s.resources[k] < (r.resources[k] ?? 0)) return `needs ${k}`;
  return null;
};

export const HutView = () => {
  void version.value;
  const s = game();
  const kettles = brewSlots(s);
  const level = s.buildings['alchemists-hut'];
  const gardens = gardenCount(s);
  const harvest = nextGardenTime(s);
  const have = CONSUMABLE_IDS.filter((c) => s.stores[c] > 0);
  const reagents = INGREDIENT_IDS.filter((i) => s.stores[i] > 0);
  return (
    <div>
      <p>
        <strong>Level {level}</strong> · {kettles} {kettles === 1 ? 'kettle' : 'kettles'} ·{' '}
        {kettlesBusy(s)} busy
      </p>
      {s.queues.brewing.length > 0 && (
        <ul class={styles.list}>
          {s.queues.brewing.map((j, i) => (
            <li key={i} class={`${styles.row} ${styles.divider}`}>
              <span class={styles.grow}>
                ⏱ {consumables[j.item].name}{' '}
                <span class={styles.dim}>
                  {j.doneAt === null
                    ? 'waiting'
                    : formatDuration(Math.max(0, j.doneAt - s.time) / 1000)}
                </span>
              </span>
              <button
                type="button"
                class={styles.btn}
                onClick={() => dispatch({ type: 'brew.cancel', index: i })}
              >
                Cancel
              </button>
            </li>
          ))}
        </ul>
      )}
      <h3 class={styles.cardTitle}>Stores</h3>
      <p class={styles.small}>
        {have.length > 0
          ? have.map((c) => `${consumables[c].name} ${s.stores[c]}`).join(' · ')
          : 'Nothing brewed yet.'}
      </p>
      <h3 class={styles.cardTitle}>Reagents</h3>
      <p class={styles.small}>
        {reagents.length > 0
          ? reagents
              .map((i) => `${ingredients[i].name.toLowerCase()} ${Math.floor(s.stores[i])}`)
              .join(' · ')
          : 'None. Herbs grow in the Herb Garden; the rest come from contracts.'}
      </p>
      {gardens > 0 && harvest !== null && (
        <p class={`${styles.small} ${styles.dim}`}>
          {gardens} Herb {gardens === 1 ? 'Garden' : 'Gardens'} · next herbs in{' '}
          {formatDuration(Math.max(0, harvest - s.time) / 1000)}
        </p>
      )}
      <h3 class={styles.cardTitle}>Recipes</h3>
      <ul class={styles.list}>
        {CONSUMABLE_IDS.map((id) => {
          const def = consumables[id];
          const why = missing(s, id);
          return (
            <li
              key={id}
              class={`${styles.row} ${styles.divider}`}
              style={why ? { opacity: 0.65 } : undefined}
            >
              <span class={styles.grow}>
                <strong>{def.name}</strong>
                <br />
                <span class={`${styles.small} ${styles.dim}`}>
                  {def.summary}
                  <br />
                  {recipeText(id)}
                  {why ? ` · ${why}` : ''}
                </span>
              </span>
              <button
                type="button"
                class={why ? styles.btn : styles.btnPrimary}
                disabled={why !== null}
                onClick={() => dispatch({ type: 'brew.queue', item: id })}
              >
                Brew ×1
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
