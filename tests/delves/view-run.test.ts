// Plan T7.13b (GDD §9.15): the doors, blessing cards, Your blessings, the result sheet, the
// Riftglass shop, the trait switch and the Echoes shelf, as the core builds them for the screens.
import { describe, expect, it } from 'vitest';
import { echoes } from '../../src/content/delves/echoes';
import { COSMETIC_IDS } from '../../src/content/delves/shop';
import { pechkoResultLines } from '../../src/content/delves/rift-text';
import { apply } from '../../src/core/commands';
import { noteBlessingTaken } from '../../src/core/delves/rewards';
import {
  resultView,
  standDelveLine,
  stageView,
  yourBlessingsView,
} from '../../src/core/delves/view-run';
import { echoesShelf, shopView, traitSwitchView } from '../../src/core/delves/view-shop';
import { cmd, PARTY, strongKeep } from './helpers';

const run = (s: ReturnType<typeof strongKeep>) => {
  if (!s.delve.run) throw new Error('no run');
  return s.delve.run;
};

const start = (seed: string) => {
  const s = strongKeep(seed);
  expect(cmd(s, { type: 'delve.start', party: PARTY }).ok).toBe(true);
  return s;
};

describe('the doors and blessing cards', () => {
  it('shows two doors with the patron, the sigil and the family ahead', () => {
    const v = stageView(start('doors'));
    if (v?.kind !== 'doors') throw new Error('no doors');
    expect(v.title).toBe('Floor 1 of 6');
    expect(v.doors).toHaveLength(2);
    expect(new Set(v.doors.map((d) => d.patron)).size).toBe(2);
    expect(v.doors[0]?.sigilId).toMatch(/^icon\.sigil\./);
    expect(v.ahead).toMatch(/^Ahead: /);
  });

  it('offers three cards with a rarity frame, a name and a one-line effect', () => {
    const s = start('offer');
    const d = stageView(s);
    if (d?.kind !== 'doors') throw new Error('no doors');
    cmd(s, { type: 'delve.chooseDoor', patron: d.doors[0]?.patron as never });
    const v = stageView(s);
    if (v?.kind !== 'offer') throw new Error('no offer');
    expect(v.cards).toHaveLength(3);
    for (const c of v.cards) {
      expect(c.frameId).toBe(`icon.rarity.${c.rarity}`);
      expect(c.text.length).toBeGreaterThan(3);
    }
    expect(v.reroll).toBe('none');
    s.delve.shop.reroll = true;
    expect(stageView(s)).toMatchObject({ reroll: 'available' });
    cmd(s, { type: 'delve.reroll' });
    expect(stageView(s)).toMatchObject({ reroll: 'used' });
  });

  it("the Unlit's card splits the gain from the red but-line", () => {
    const s = start('unlit');
    s.delve.unlitOpen = true;
    run(s).stage = { kind: 'offer', patron: 'unlit', cards: ['cold-hands'] };
    const v = stageView(s);
    if (v?.kind !== 'offer') throw new Error('no offer');
    expect(v.cards[0]).toMatchObject({ text: '+20% Might', but: '−20% max Health' });
  });

  it('Chosen start shows the patrons, then three Faint blessings of the one picked', () => {
    const s = strongKeep('chosen');
    s.delve.shop.chosenStart = true;
    cmd(s, { type: 'delve.start', party: PARTY });
    const a = stageView(s);
    if (a?.kind !== 'start') throw new Error('no start');
    expect(a.patron).toBeNull();
    expect(a.choices).toHaveLength(5); // the Unlit's door is still locked
    cmd(s, { type: 'delve.chooseStart', patron: 'wolf' });
    const b = stageView(s);
    if (b?.kind !== 'start') throw new Error('no start');
    expect(b.cards).toHaveLength(3);
    expect(b.cards.every((c) => c.rarity === 'faint')).toBe(true);
  });

  it('has nothing to show at a fight or with no run', () => {
    expect(stageView(strongKeep('none'))).toBeNull();
  });
});

describe('Your blessings', () => {
  it('lists every blessing taken with a breakdown of its numbers', () => {
    const s = start('mine');
    expect(yourBlessingsView(s).items).toEqual([]);
    for (let i = 0; i < 2; i++) {
      const v = stageView(s);
      if (v?.kind === 'doors')
        cmd(s, { type: 'delve.chooseDoor', patron: v.doors[0]?.patron as never });
      const o = stageView(s);
      if (o?.kind === 'offer')
        cmd(s, { type: 'delve.chooseBlessing', blessing: o.cards[0]?.id ?? '' });
      if (s.delve.run?.stage.kind === 'fight') cmd(s, { type: 'delve.fight' });
    }
    const y = yourBlessingsView(s);
    expect(y.items.length).toBeGreaterThanOrEqual(1);
    expect(y.breakdown.label).toBe('Your blessings');
    expect(y.breakdown.children?.length).toBe(y.items.length);
  });
});

describe('the result sheet', () => {
  it('a run left early: the headline, the earned numbers and an early-end line', () => {
    const s = start('left');
    cmd(s, { type: 'delve.leave' });
    const v = resultView(s);
    expect(v?.headline).toBe('You came back up');
    expect(pechkoResultLines.endedEarly as readonly string[]).toContain(v?.pechko);
  });

  it('a guardian beaten: reagents, a relic and the guardian line', () => {
    const s = strongKeep('whole');
    cmd(s, { type: 'delve.start', party: PARTY });
    for (let i = 0; i < 80 && s.delve.run; i++) {
      const v = stageView(s);
      if (v?.kind === 'doors')
        cmd(s, { type: 'delve.chooseDoor', patron: v.doors[0]?.patron as never });
      else if (v?.kind === 'offer')
        cmd(s, { type: 'delve.chooseBlessing', blessing: v.cards[0]?.id ?? '' });
      else cmd(s, { type: 'delve.fight' });
    }
    const r = resultView(s);
    expect(r?.headline).toBe('The guardian is beaten');
    expect(pechkoResultLines.guardianBeaten as readonly string[]).toContain(r?.pechko);
    expect(r?.reagents.length).toBeGreaterThan(0);
    expect(r?.relics.map((x) => x.name)).toContain('Spindle Whorl');
    expect(r?.echoes.length).toBeGreaterThan(0);
    expect(r?.floors).toBeGreaterThanOrEqual(7);
  });

  it('an empty allowance is "the rift is quiet tonight", with Pechko\'s quiet line', () => {
    const s = strongKeep('quiet');
    s.delve.allowance = 0;
    cmd(s, { type: 'delve.start', party: PARTY });
    cmd(s, { type: 'delve.leave' });
    const v = resultView(s);
    expect(v?.quiet).toBe(true);
    expect(pechkoResultLines.quietTonight as readonly string[]).toContain(v?.pechko);
  });

  it('is gone once read', () => {
    const s = start('read');
    cmd(s, { type: 'delve.leave' });
    cmd(s, { type: 'delve.ackResult' });
    expect(resultView(s)).toBeNull();
  });

  it('the Last Stand line only shows while a run is paused', () => {
    const s = strongKeep('stand-line');
    expect(standDelveLine(s)).toBeNull();
    cmd(s, { type: 'delve.start', party: PARTY });
    expect(standDelveLine(s)).toBe('Your Delve ends here; you keep what it earned.');
  });
});

describe('the Riftglass shop', () => {
  it('every row says exactly what its command would do', () => {
    const s = strongKeep('shop');
    s.delve.riftglass = 100;
    const v = shopView(s);
    const rows = [v.late, ...v.delveOnly, ...v.cosmetics];
    expect(rows).toHaveLength(1 + 2 + COSMETIC_IDS.length);
    for (const row of rows) {
      if (!row.command) continue;
      const probe = structuredClone(s);
      const r = apply(probe, row.command, probe.time);
      if (row.problem) expect(r).toEqual({ ok: false, reason: row.problem });
      else expect(r.ok, row.id).toBe(true);
    }
    for (const t of v.traits) {
      const probe = structuredClone(s);
      const r = apply(probe, { type: 'riftglass.buyTrait', hunter: t.hunter }, probe.time);
      if (t.problem) expect(r).toEqual({ ok: false, reason: t.problem });
      else expect(r.ok, t.hunter).toBe(true);
    }
  });

  it('shows what is short, and what is bought', () => {
    const s = strongKeep('short');
    s.delve.riftglass = 10;
    const v = shopView(s);
    expect(v.late.problem).toMatch(/costs 30 Riftglass; you have 10/);
    s.delve.shop.chosenStart = true;
    expect(shopView(s).delveOnly[0]).toMatchObject({ owned: true, cost: null, status: 'bought' });
    expect(v.late.status).toBe('level 0 of 5');
  });

  it('lists a trait for each hunter at the hold, and the relics found', () => {
    const s = strongKeep('rows');
    s.delve.relics.push({ id: 'salt-ring', cycle: 1 });
    const v = shopView(s);
    expect(v.traits.map((t) => t.hunter)).toContain('halvar');
    expect(v.relics.map((r) => r.name)).toEqual(['Salt Ring']);
  });
});

describe('the trait switch on the hunter sheet', () => {
  it('shows only the traits until the other is bought, then both and the switch', () => {
    const s = strongKeep('switch');
    s.delve.riftglass = 100;
    const before = traitSwitchView(s, 'halvar');
    expect(before?.bought).toBe(false);
    expect(before?.other).toBeNull();
    cmd(s, { type: 'riftglass.buyTrait', hunter: 'halvar' });
    const owned = traitSwitchView(s, 'halvar');
    expect(owned?.other?.name).toBe('Smoke-Lunged');
    expect(owned?.problem).toBeNull();
    cmd(s, { type: 'riftglass.switchTrait', hunter: 'halvar', alternate: true });
    const on = traitSwitchView(s, 'halvar');
    expect(on?.active).toBe(true);
    expect(on?.current.map((t) => t.name)).toContain('Smoke-Lunged');
    expect(on?.other?.name).not.toBe('Smoke-Lunged');
  });

  it('says why it cannot be switched while a hunter is in a Delve', () => {
    const s = strongKeep('busy');
    s.delve.riftglass = 100;
    cmd(s, { type: 'riftglass.buyTrait', hunter: 'halvar' });
    cmd(s, { type: 'delve.start', party: PARTY });
    expect(traitSwitchView(s, 'halvar')?.problem).toMatch(/in a Delve/);
  });
});

describe('the Echoes shelf', () => {
  it('lists the echoes found, with their patron and rarity, oldest first', () => {
    const s = strongKeep('shelf');
    expect(echoesShelf(s)).toEqual([]);
    noteBlessingTaken(s, 'pale-smith', 'faint', null);
    noteBlessingTaken(s, 'wolf', 'warm', null);
    const shelf = echoesShelf(s);
    expect(shelf.map((e) => e.id)).toEqual(['E-01', 'E-08']);
    expect(shelf[0]).toMatchObject({ patronName: 'The Pale Smith', rarityName: 'Faint' });
    expect(shelf[0]?.text).toBe(echoes[0]?.text);
  });
});
