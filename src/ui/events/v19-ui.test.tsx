// Plan T19.7: 5-boss Events view & shelf, Fire attack callouts/logs & bomb/burn playback steps,
// and Courtyard Marks #7-#8 rendering across HoldGrid, HoldScene, and HoldLookSheet.
import { describe, expect, it, vi } from 'vitest';
import { apply } from '../../core/commands/apply';
import { runFight } from '../../core/combat';
import { playbackSteps } from '../../core/delves/view';
import { seeded } from '../../core/rng';
import { formatDuration } from '../../core/format';
import { brewDuration, experimentDuration } from '../../core/alchemy/brewing';
import { createNewGame } from '../../core/state/new-game';
import { bossSheetView, tierExplained } from '../../core/systems/events-view';
import { greatBeastsShelf } from '../../core/systems/events-results';
import { buildHoldGridView } from '../../core/systems/layout';
import { Arena } from '../delve/Arena';
import { BossSheet } from './BossSheet';
import { GreatBeastsShelf } from './GreatBeastsShelf';
import { BrewSection } from '../sheets/HutSheet';
import { HoldLookSheet } from '../sheets/HoldLookSheet';
import { HoldGrid } from '../widgets/HoldGrid';
import { HoldScene } from '../widgets/HoldScene';
import * as runtime from '../app/runtime';
import { snap } from '../../../tests/combat/helpers';

const NOW = 1_700_000_000_000;

interface VNodeLike {
  type: unknown;
  props: Record<string, unknown>;
}

const isVNode = (n: unknown): n is VNodeLike =>
  typeof n === 'object' && n !== null && 'type' in n && 'props' in n;

const collectText = (node: unknown): string => {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(collectText).join('');
  if (isVNode(node)) {
    if (typeof node.type === 'function') {
      const name = (node.type as { name?: string }).name;
      // Stop before stateful Preact-hook leaf widgets when scanning pure parents in Node.
      if (name === 'BattleSprite' || name === 'Sprite') return '';
      if (name === 'Num') return typeof node.props.text === 'string' ? node.props.text : '';
      return collectText((node.type as (p: Record<string, unknown>) => unknown)(node.props));
    }
    return collectText(node.props.children);
  }
  return '';
};

const collectNodes = (
  node: unknown,
  match: (v: VNodeLike) => boolean,
  out: VNodeLike[] = [],
): VNodeLike[] => {
  if (Array.isArray(node)) {
    for (const item of node) collectNodes(item, match, out);
    return out;
  }
  if (!isVNode(node)) return out;
  if (match(node)) out.push(node);
  if (typeof node.type === 'function') {
    const name = (node.type as { name?: string }).name;
    if (name === 'BattleSprite' || name === 'Sprite' || name === 'Num' || name === 'BrewRow') {
      return out;
    }
    collectNodes((node.type as (p: Record<string, unknown>) => unknown)(node.props), match, out);
    return out;
  }
  collectNodes(node.props.children, match, out);
  return out;
};

describe('v1.9 5-boss Events UI and Fire callouts (T19.7)', () => {
  it('updates tier breakdown wording to five bosses and displays Fire attacks on The Beacon-Bane', () => {
    const s = createNewGame('events-ui-v19', NOW);
    s.cycle.age = 'bastion';
    s.events.opened = true;
    s.events.boss.visit = 9; // Pass 1, Beacon-Bane
    const spy = vi.spyOn(runtime, 'game').mockReturnValue(s);
    try {
      const tier = tierExplained(s);
      expect(
        tier.breakdown.children?.some((c) => c.label === 'Completed passes through the five'),
      ).toBe(true);

      const view = bossSheetView(s, NOW);
      expect(view.name).toBe('The Beacon-Bane');
      expect(view.lines.attack).toBe('Fire');

      const sheetText = collectText(BossSheet());
      expect(sheetText).toContain('The Beacon-Bane');
      expect(sheetText).toContain('attacks: Fire');
      expect(sheetText).toContain('Pitch-Flare · Curse-Brand');

      const shelf = greatBeastsShelf(s);
      expect(shelf.entries).toHaveLength(8);
      const bane = shelf.entries.find((e) => e.id === 'beacon-bane');
      expect(bane?.identified).toBe(true);
      expect(bane?.stats).toContain('2 Fire attacks an action');
      expect(collectText(GreatBeastsShelf())).toContain('The Beacon-Bane');
    } finally {
      spy.mockRestore();
    }
  });

  it('tracks Fire Pot, burn ticks, Saltburst, direct Fire hits, and Pitch-Flare in playback callouts and Arena', () => {
    const party = [snap('halvar', { base: { health: 2000, might: 25, armor: 5, speed: 9 } })];
    const r = runFight({
      party,
      monster: { event: 'beacon-bane', tier: 3, healthOverride: 1000 },
      location: null,
      rolls: seeded('fire-callout-v19'),
      prep: { oils: {}, potions: {}, bombs: ['fire-pot', 'saltburst'] },
    });

    const fireBomb = r.log.find((e) => e.kind === 'bomb' && e.text.includes('Fire Pot'));
    const burn = r.log.find((e) => e.kind === 'burn');
    const flare = r.log.find((e) => e.kind === 'ability' && e.text.includes('Pitch-Flare'));
    const directFire = r.log.find(
      (e) => e.actor === 'beacon-bane' && (e.kind === 'hit' || e.kind === 'crit'),
    );

    expect(fireBomb?.target).toBe('beacon-bane');
    expect(burn?.target).toBe('beacon-bane');
    expect(flare?.target).toBe('halvar');
    expect(directFire?.text).toContain('Fire');

    const { steps } = playbackSteps(r, [
      {
        id: 'halvar',
        name: 'Halvar',
        side: 'hunter',
        spriteId: 'sprite.hunter.halvar',
        portraitId: 'portrait.hunter.halvar',
        start: 1,
      },
      {
        id: 'beacon-bane',
        name: 'The Beacon-Bane',
        side: 'monster',
        spriteId: 'sprite.creature.beacon-bane',
        portraitId: 'portrait.creature.beacon-bane',
        start: 1,
      },
    ]);

    const bombStep = steps.find((st) => st.kind === 'bomb' && st.text.includes('Fire Pot'));
    const burnStep = steps.find((st) => st.kind === 'burn');
    const saltStep = steps.find((st) => st.kind === 'bomb' && st.text.includes('goes off'));
    const flareStep = steps.find((st) => st.kind === 'ability' && st.text.includes('Pitch-Flare'));
    const fireAttackStep = steps.find(
      (st) => st.actor === 'beacon-bane' && (st.kind === 'hit' || st.kind === 'crit'),
    );
    expect(bombStep?.callout).toEqual({
      target: 'beacon-bane',
      tone: 'hit',
      text: `-${fireBomb?.amount}`,
    });
    expect(bombStep?.bars['beacon-bane']).toBeLessThan(1);
    expect(burnStep?.callout).toEqual({
      target: 'beacon-bane',
      tone: 'hit',
      text: `-${burn?.amount}`,
    });
    expect(saltStep?.callout?.target).toBe('beacon-bane');
    expect(flareStep?.callout).toEqual({
      target: 'halvar',
      tone: 'hit',
      text: `-${flare?.amount}`,
    });
    expect(fireAttackStep?.callout?.target).toBe('halvar');

    const spy = vi.spyOn(runtime, 'game').mockReturnValue(createNewGame('arena-ui', NOW));
    try {
      const arenaVnode = Arena({
        combatants: [
          {
            id: 'halvar',
            name: 'Halvar',
            side: 'hunter',
            spriteId: 'sprite.hunter.halvar',
            portraitId: 'portrait.hunter.halvar',
            start: 1,
          },
          {
            id: 'beacon-bane',
            name: 'The Beacon-Bane',
            side: 'monster',
            spriteId: 'sprite.creature.beacon-bane',
            portraitId: 'portrait.creature.beacon-bane',
            start: 1,
          },
        ],
        bars: bombStep?.bars ?? { halvar: 1, 'beacon-bane': 1 },
        frames: {},
        callout: flareStep?.callout ?? null,
      });
      const callouts = collectNodes(arenaVnode, (v) => v.props['data-testid'] === 'arena-callout');
      expect(callouts).toHaveLength(1);
      expect(collectText(callouts[0])).toBe(`-${flare?.amount}`);
    } finally {
      spy.mockRestore();
    }
  });

  it('renders Courtyard Marks #7 and #8 in HoldGrid, HoldScene, and HoldLookSheet', () => {
    const s = createNewGame('marks-7-8-ui', NOW);
    s.cycle.age = 'bastion';
    apply(s, { type: 'debug.layoutFillBastion' }, NOW);
    s.cosmetics.marks = {
      'thorn-antler-rack': true,
      'beacon-iron-urn': true,
    };
    const spy = vi.spyOn(runtime, 'game').mockReturnValue(s);
    try {
      const gridView = buildHoldGridView(s);
      expect(gridView.courtyardMarks).toEqual(['thorn-antler-rack', 'beacon-iron-urn']);

      const gridNodes = collectNodes(
        HoldGrid(),
        (v) => typeof v.props['data-courtyard-mark'] === 'string',
      );
      expect(gridNodes.map((v) => v.props['data-courtyard-mark'])).toEqual([
        'thorn-antler-rack',
        'beacon-iron-urn',
      ]);

      const sceneNodes = collectNodes(
        HoldScene({ age: 'bastion' }),
        (v) => typeof v.props['data-courtyard-mark'] === 'string',
      );
      expect(sceneNodes.map((v) => v.props['data-courtyard-mark'])).toEqual([
        'thorn-antler-rack',
        'beacon-iron-urn',
      ]);

      const lookText = collectText(HoldLookSheet());
      expect(lookText).toContain('Thorn-Antler Rack');
      expect(lookText).toContain('Earned · The Thorn-Stag');
      expect(lookText).toContain('Beacon-Iron Urn');
      expect(lookText).toContain('Earned · The Beacon-Bane');
    } finally {
      spy.mockRestore();
    }
  });

  it('wires Hut kettle-speed breakdown for Alchemist’s Hut level and Alchemist links', () => {
    const s = createNewGame('hut-kettle-ui-v19', NOW);
    s.buildings['alchemists-hut'] = 3;
    s.skills.alchemy = 3;
    const tree = BrewSection({ s });
    const brewLine = collectNodes(tree, (v) => v.props['data-testid'] === 'brew-time-line');
    expect(brewLine).toHaveLength(1);
    const numNodes = collectNodes(
      brewLine[0],
      (v) => typeof v.type === 'function' && (v.type as { name?: string }).name === 'Num',
    );
    expect(numNodes).toHaveLength(1);
    const brewTime = brewDuration(s);
    const expTime = experimentDuration(s);
    expect(numNodes[0]?.props.text).toBe(formatDuration(brewTime.value));
    const breakdown = (numNodes[0]?.props.breakdown as () => { children?: { label: string }[] })();
    const labels = (breakdown.children ?? []).map((c) => c.label);
    expect(labels.some((l) => l.includes("Alchemist's Hut Lv 3"))).toBe(true);
    expect(labels.some((l) => l.includes('Alchemist'))).toBe(true);
    expect(expTime.breakdown.children?.some((c) => c.label.includes("Alchemist's Hut Lv 3"))).toBe(
      true,
    );
  });
});
