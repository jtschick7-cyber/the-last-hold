import { useState } from 'preact/hooks';
import { CONSUMABLE_IDS, consumables, type ConsumableId } from '../../content/consumables';
import { INGREDIENT_IDS, ingredients, type IngredientId } from '../../content/ingredients';
import { greyWivesBookLine } from '../../core/story/orders-views';
import { experimentProblem, knownRecipes } from '../../core/alchemy/book';
import { brewSummary } from '../../core/alchemy/brew-text';
import { skillLevel } from '../../core/skills/skills';
import type { Breakdown } from '../../core/breakdown/breakdown';
import { Num } from '../widgets/Num';
import { brewSlots, experimentMs, kettlesBusy } from '../../core/alchemy/brewing';
import { gardenCount, nextGardenTime } from '../../core/alchemy/garden';
import {
  bookCount,
  bookRows,
  hiddenCount,
  recipeShortfall,
  recipeWords,
  triedPairs,
} from '../../core/alchemy/hut-view';
import { num } from '../../core/balance-access';
import { formatDuration } from '../../core/format';
import type { GameState } from '../../core/state/game-state';
import { brewIconId } from '../../content/assets';
import { dispatch, game, hutNews, version } from '../app/runtime';
import { Sprite } from '../widgets/Sprite';
import styles from '../styles/ui.module.css';

// GDD §9.9: the Alchemist's Hut. Three sections: Brew (every known recipe of each brew),
// Experiment (two ingredients, one kettle, what is still hidden) and Book (the 12 × 3 grid).
// The rules are in core/alchemy; this only shows them.

type Section = 'brew' | 'experiment' | 'book';
const SECTIONS: readonly { id: Section; label: string }[] = [
  { id: 'brew', label: 'Brew' },
  { id: 'experiment', label: 'Experiment' },
  { id: 'book', label: 'Book' },
];

const lower = (id: IngredientId): string => ingredients[id].name.toLowerCase();

const BrewRow = ({ s, id }: { s: GameState; id: ConsumableId }) => {
  const recipes = knownRecipes(s, id);
  const [pick, setPick] = useState(0);
  const recipe = recipes[Math.min(pick, recipes.length - 1)];
  if (!recipe) return null;
  const why = recipeShortfall(s, recipe);
  const def = consumables[id];
  const icon = brewIconId(id);
  const summary = brewSummary(skillLevel(s, 'alchemy'), id);
  return (
    <li
      class={`${styles.row} ${styles.divider}`}
      style={{ ...(why ? { opacity: 0.85 } : {}), alignItems: 'flex-start' }}
    >
      {icon && <Sprite id={icon} scale={2} />}
      <span class={styles.grow}>
        <strong>{def.name}</strong>
        <br />
        {summary.breakdown ? (
          <span class={styles.small}>
            <Num text={summary.text} breakdown={() => summary.breakdown as Breakdown} marked />
          </span>
        ) : (
          <span class={`${styles.small} ${styles.dim}`}>{summary.text}</span>
        )}
        <br />
        {recipes.length > 1 ? (
          <select
            aria-label={`${def.name} recipe`}
            style={{ minHeight: '44px', maxWidth: '100%' }}
            value={pick}
            onChange={(e) => setPick(Number(e.currentTarget.value))}
          >
            {recipes.map((r, i) => (
              <option key={i} value={i}>
                {recipeWords(r)}
                {recipeShortfall(s, r) ? ' (short)' : ''}
              </option>
            ))}
          </select>
        ) : (
          <span class={`${styles.small} ${styles.dim}`}>{recipeWords(recipe)}</span>
        )}
        {why && <span class={`${styles.small} ${styles.dim}`}> · {why}</span>}
      </span>
      <button
        type="button"
        class={why ? styles.btn : styles.btnPrimary}
        disabled={why !== null}
        onClick={() =>
          dispatch({ type: 'brew.queue', item: id, ingredients: { ...recipe.ingredients } })
        }
      >
        Brew ×1
      </button>
    </li>
  );
};

const BrewSection = ({ s }: { s: GameState }) => {
  const have = CONSUMABLE_IDS.filter((c) => s.stores[c] > 0);
  const reagents = INGREDIENT_IDS.filter((i) => s.stores[i] > 0);
  const known = CONSUMABLE_IDS.filter((id) => knownRecipes(s, id).length > 0);
  return (
    <div>
      <h3 class={styles.cardTitle}>Stores</h3>
      <p class={styles.small}>
        {have.length > 0
          ? have.map((c) => `${consumables[c].name} ${s.stores[c]}`).join(' · ')
          : 'Nothing brewed yet.'}
      </p>
      <h3 class={styles.cardTitle}>Reagents</h3>
      <p class={styles.small}>
        {reagents.length > 0
          ? reagents.map((i) => `${lower(i)} ${Math.floor(s.stores[i])}`).join(' · ')
          : 'None. Herbs grow in the Herb Garden; the rest come from contracts.'}
      </p>
      <h3 class={styles.cardTitle}>Recipes</h3>
      <ul class={styles.list}>
        {known.map((id) => (
          <BrewRow key={id} s={s} id={id} />
        ))}
      </ul>
      {known.length < CONSUMABLE_IDS.length && (
        <p class={`${styles.small} ${styles.dim}`}>
          {CONSUMABLE_IDS.length - known.length} more brews wait to be discovered. Try pairs of
          ingredients under Experiment.
        </p>
      )}
    </div>
  );
};

const IngredientPick = ({
  s,
  label,
  value,
  onChange,
}: {
  s: GameState;
  label: string;
  value: IngredientId | '';
  onChange: (v: IngredientId | '') => void;
}) => (
  <label class={styles.row}>
    <span style={{ minWidth: '4.5rem' }} class={styles.small}>
      {label}
    </span>
    <select
      class={styles.grow}
      style={{ minHeight: '44px' }}
      value={value}
      onChange={(e) => onChange(e.currentTarget.value as IngredientId | '')}
    >
      <option value="">—</option>
      {INGREDIENT_IDS.map((id) => (
        <option key={id} value={id} disabled={s.stores[id] < num('experiment.units')}>
          {ingredients[id].name} ×{Math.floor(s.stores[id])} · {hiddenCount(s, id)} hidden
        </option>
      ))}
    </select>
  </label>
);

const ExperimentSection = ({ s }: { s: GameState }) => {
  const [a, setA] = useState<IngredientId | ''>('');
  const [b, setB] = useState<IngredientId | ''>('');
  const units = num('experiment.units');
  const problem =
    a && b ? experimentProblem(s, a, b) : 'Pick two ingredients to put in a kettle together.';
  const kettle = brewSlots(s) === 0 ? 'Build an Alchemist’s Hut to experiment.' : null;
  const short =
    a && b && !problem && (s.stores[a] < units || s.stores[b] < units)
      ? 'Not enough of one of them.'
      : null;
  const why = kettle ?? problem ?? short;
  return (
    <div>
      <p class={styles.small}>
        An experiment puts {units} of each ingredient in a kettle for{' '}
        {formatDuration(experimentMs(s) / 1000)} and teaches what the pair shares. Nothing is
        brewed.
      </p>
      <IngredientPick s={s} label="First" value={a} onChange={setA} />
      <IngredientPick s={s} label="Second" value={b} onChange={setB} />
      {why && <p class={`${styles.small} ${styles.dim}`}>{why}</p>}
      <button
        type="button"
        class={why ? styles.btn : styles.btnPrimary}
        style={{ width: '100%' }}
        disabled={why !== null || !a || !b}
        onClick={() => {
          if (a && b && dispatch({ type: 'experiment.queue', a, b }).ok) {
            setA('');
            setB('');
          }
        }}
      >
        Experiment · {units} each · {formatDuration(experimentMs(s) / 1000)}
      </button>
    </div>
  );
};

const BookSection = ({ s }: { s: GameState }) => {
  const { found, total } = bookCount(s);
  const pairs = triedPairs(s);
  const book = greyWivesBookLine(s);
  return (
    <div>
      <p>
        <strong>
          Properties found: {found} of {total}
        </strong>
      </p>
      <table class={styles.ledger} style={{ fontSize: '0.8125rem' }}>
        <thead>
          <tr>
            <th>Ingredient</th>
            <th colSpan={3}>Properties</th>
          </tr>
        </thead>
        <tbody>
          {bookRows(s).map((row) => (
            <tr key={row.ingredient}>
              <td>{ingredients[row.ingredient].name}</td>
              {row.slots.map((brew, i) => (
                <td key={i} class={brew ? undefined : styles.dim}>
                  {brew ? consumables[brew].name : '?'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {book && (
        <p class={styles.small}>
          <strong>The eldest Grey Wife says:</strong> <em>{book.text}</em>
        </p>
      )}
      <h3 class={styles.cardTitle}>Brews</h3>
      <ul class={styles.list}>
        {CONSUMABLE_IDS.map((id) => {
          const recipes = knownRecipes(s, id);
          return (
            <li key={id} class={styles.divider}>
              {brewIconId(id) && <Sprite id={brewIconId(id) ?? ''} />}{' '}
              <strong>{consumables[id].name}</strong>
              <br />
              <span class={`${styles.small} ${styles.dim}`}>
                {recipes.length > 0
                  ? recipes.map(recipeWords).join('  /  ')
                  : 'Not discovered yet.'}
              </span>
            </li>
          );
        })}
      </ul>
      <h3 class={styles.cardTitle}>Pairs tried ({pairs.length})</h3>
      <p class={`${styles.small} ${styles.dim}`}>
        {pairs.length > 0
          ? pairs.map(([x, y]) => `${lower(x)} + ${lower(y)}`).join(' · ')
          : 'None yet.'}
      </p>
    </div>
  );
};

export const HutView = () => {
  void version.value;
  const s = game();
  const [section, setSection] = useState<Section>('brew');
  const kettles = brewSlots(s);
  const level = s.buildings['alchemists-hut'];
  const gardens = gardenCount(s);
  const harvest = nextGardenTime(s);
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
                ⏱{' '}
                {j.kind === 'brew'
                  ? consumables[j.item].name
                  : `Experiment: ${ingredients[j.a].name} + ${ingredients[j.b].name}`}{' '}
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
      {gardens > 0 && harvest !== null && (
        <p class={`${styles.small} ${styles.dim}`}>
          {gardens} Herb {gardens === 1 ? 'Garden' : 'Gardens'} · next herbs in{' '}
          {formatDuration(Math.max(0, harvest - s.time) / 1000)}
        </p>
      )}
      {hutNews.value.length > 0 && (
        <div class={styles.small} aria-live="polite">
          {hutNews.value.map((line, i) => (
            <p key={i} class={styles.good}>
              {line}
            </p>
          ))}
        </div>
      )}
      <div class={styles.segmented} role="group" aria-label="Hut section">
        {SECTIONS.map((x) => (
          <button
            key={x.id}
            type="button"
            class={section === x.id ? styles.segmentOn : styles.segment}
            aria-pressed={section === x.id}
            onClick={() => setSection(x.id)}
          >
            {x.label}
          </button>
        ))}
      </div>
      {section === 'brew' && <BrewSection s={s} />}
      {section === 'experiment' && <ExperimentSection s={s} />}
      {section === 'book' && <BookSection s={s} />}
    </div>
  );
};
