import { KNOWLEDGE_LEVELS, knowledgeLevels } from '../../content/knowledge';
import { consumables, type ConsumableId } from '../../content/consumables';
import { ingredients, type IngredientId } from '../../content/ingredients';
import { families } from '../../content/damage';
import { monsters, type MonsterId } from '../../content/monsters';
import { brewSummary } from '../../core/alchemy/brew-text';
import { num } from '../../core/balance-access';
import { oilMatches } from '../../core/contracts/prep';
import type { CandidateView, ContractIdentity } from '../../core/investigation/view';

// Plain wording for knowledge, investigation and preparation (GDD §5.6–5.7, §9.4–9.9).

/** The bestiary's footer: the thresholds come from balance (knowledge.*, D99). */
export const bestiaryLegend = (): string =>
  `[?] seen on a contract, not yet identified · [·] not yet met. Win ${num(
    'knowledge.studiedKills',
  )} times to study a species and ${num('knowledge.masteredKills')} to master it.`;

export const levelName = (level: number): string =>
  knowledgeLevels[KNOWLEDGE_LEVELS[level] ?? 'unknown'].name;

/** "? 3 candidates" for an unidentified contract, the species' name once it is known. */
export const identityText = (v: ContractIdentity): string => {
  if (v.identified && v.monster) return `${monsters[v.monster].name} (${levelName(v.level)})`;
  const n = v.candidates.length;
  return `? ${n} candidate${n === 1 ? '' : 's'}`;
};

/** The candidates as the player sees them: names where Identified, "?" where only Sighted. */
export const candidateList = (candidates: readonly CandidateView[]): string =>
  candidates.map((c) => c.name ?? '?').join(' · ');

export const ingredientName = (id: IngredientId): string => ingredients[id].name;

/** "2 grave dust · 1 juniper · 1 wood" */
export const recipeText = (id: ConsumableId): string => {
  const r = consumables[id].recipe;
  if (!r) return '';
  const parts = [
    ...Object.entries(r.ingredients).map(
      ([k, n]) => `${n} ${ingredientName(k as IngredientId).toLowerCase()}`,
    ),
    ...Object.entries(r.resources).map(([k, n]) => `${n} ${k}`),
  ];
  return parts.join(' · ');
};

/** What a chosen oil does against this contract: the species, or each candidate (GDD §5.7). */
export const oilNote = (oil: ConsumableId, v: ContractIdentity, alchemy = 0): string => {
  const def = consumables[oil];
  const e = def.effect;
  if (e.kind !== 'oil') return '';
  const family = families[e.family].name;
  if (v.identified && v.monster) {
    return oilMatches(oil, v.monster)
      ? `${def.name}: ${brewSummary(alchemy, oil).text}`
      : `${def.name}: no effect (target: ${families[monsters[v.monster].family].name})`;
  }
  const works = v.candidates.filter((c) => oilMatches(oil, c.monster));
  if (works.length === 0) return `${def.name}: no effect on any candidate (it is for ${family})`;
  if (works.length === v.candidates.length) return `${def.name}: works on every candidate`;
  const names = works.map((c) => (c.name ?? '?') as string);
  return `${def.name}: works on ${names.join(', ')}; no effect on the other ${
    v.candidates.length - works.length
  }`;
};

export const monsterName = (m: MonsterId): string => monsters[m].name;
