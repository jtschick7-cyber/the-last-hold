import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { BOSS_IDS, bosses } from '../src/content/great-beasts';
import type { HunterId } from '../src/content/hunters';
import { hunts, quarries } from '../src/content/hunts';
import { runFight } from '../src/core/combat';
import { num } from '../src/core/balance-access';
import { play } from '../src/core/policies';
import { eventPrep, pickParty } from '../src/core/policies/eventer';
import { seeded } from '../src/core/rng';
import { skillLevel } from '../src/core/skills/skills';
import { createNewGame } from '../src/core/state/new-game';
import type { GameState } from '../src/core/state/game-state';
import { poolAtTier } from '../src/core/systems/boss';
import { eventsUnlocked } from '../src/core/systems/events';
import { trackBlock, trackTier } from '../src/core/systems/hunt';
import { snapshotOf } from '../src/core/systems/hunters';
import { STARTS } from './run';

// Plan T9.13 (GDD §7.11 calibration): a ONE-OFF measuring script, not part of the suite. It plays an
// Eventer game, takes snapshots, and on each measures (a) the median damage per boss attempt at
// tiers 4 and 5 for the Eventer's party and kit, and (b) the win rate of each of the nine tracks with
// the best legal party among ALL owned hunters (rest and contracts ignored: this is the ceiling the
// tracks are tuned against). Snapshots are played once and cached as JSON in <dir>; measuring then
// loads them, so content can be tuned without replaying the games.
// Run: npx vite-node sim/calibrate-events.ts <dir> [snap|measure|both] [out.md]

const DAY = 24 * 3_600_000;
const BOSS_SAMPLES = 100;
const PICK_SAMPLES = 12;
const FINAL_SAMPLES = 300;
const MAX_COMBOS = 80;

const dir = process.argv[2] ?? join(process.cwd(), 'sim', 'reports', 'calibrate');
const mode = process.argv[3] ?? 'both';
const out = process.argv[4] ?? join(dir, 'calibrate-events.md');
const SEEDS = ['sim-1', 'sim-2', 'sim-3', 'sim-4', 'sim-5'];
const KINDS = ['open', 'bastion', 'c2', 'c3'] as const;
const LABEL: Record<(typeof KINDS)[number], string> = {
  open: 'Events just open (Citadel, cycle 1)',
  bastion: 'First check-in at the Bastion (cycle 1)',
  c2: 'Cycle 2',
  c3: 'Cycle 3',
};
const lines: string[] = [];
const say = (s: string): void => {
  lines.push(s);
  console.log(s);
};

const median = (xs: number[]): number => {
  const a = [...xs].sort((x, y) => x - y);
  return a[Math.floor(a.length / 2)] ?? 0;
};
function* combos<T>(from: readonly T[], size: number): Generator<T[]> {
  const chosen: T[] = [];
  function* walk(start: number): Generator<T[]> {
    if (chosen.length === size) {
      yield [...chosen];
      return;
    }
    for (let i = start; i <= from.length - (size - chosen.length); i++) {
      chosen.push(from[i] as T);
      yield* walk(i + 1);
      chosen.pop();
    }
  }
  yield* walk(0);
}

type Kind = (typeof KINDS)[number];
const snapPath = (seed: string, kind: Kind): string => join(dir, `snap-${seed}-${kind}.json`);

const play5 = (): void => {
  mkdirSync(dir, { recursive: true });
  for (const seed of SEEDS) {
    const start = STARTS.mon;
    const state = createNewGame(seed, start);
    const taken = new Set<Kind>();
    const take = (kind: Kind, s: GameState): void => {
      if (taken.has(kind)) return;
      taken.add(kind);
      writeFileSync(snapPath(seed, kind), JSON.stringify(s));
    };
    play(state, {
      policy: 'eventer',
      startedAt: start,
      until: start + 30 * DAY,
      stop: () => taken.size >= KINDS.length,
      onCheckIn: (_rec, s) => {
        if (!eventsUnlocked(s)) return;
        take('open', s);
        if (s.cycle.age === 'bastion') take('bastion', s);
        if (s.cycle.number >= 2) take('c2', s);
        if (s.cycle.number >= 3) take('c3', s);
      },
    });
  }
};

interface Measured {
  /** Median damage per boss attempt: boss → tier → value. */
  readonly boss: Record<string, Record<number, number>>;
  /** Win rate per track, or null when no legal party of four exists. */
  readonly track: Record<string, number | null>;
}

const measure = (s: GameState): Measured => {
  const owned = (Object.keys(s.hunters) as HunterId[]).filter((id) => s.hunters[id]);
  const alchemy = skillLevel(s, 'alchemy');
  const level = (id: HunterId): number => s.hunters[id]?.level ?? 0;
  const boss: Measured['boss'] = {};
  const party = pickParty(s, owned, num('boss.partySize'));
  for (const id of BOSS_IDS) {
    boss[id] = {};
    for (const tier of [4, 5]) {
      const pool = poolAtTier(tier);
      const prep = eventPrep(s, party, bosses[id]);
      const dealt: number[] = [];
      for (let i = 0; i < BOSS_SAMPLES; i++) {
        const f = runFight({
          party: party.map((h) => snapshotOf(s, h)),
          monster: { event: id, tier, healthOverride: pool },
          location: null,
          rolls: seeded(`cal-boss-${id}-${tier}-${i}`),
          log: false,
          prep,
          alchemy,
        });
        dealt.push(pool - Math.max(0, Math.min(pool, f.monsterHealth)));
      }
      (boss[id] as Record<number, number>)[tier] = median(dealt);
    }
  }
  const track: Measured['track'] = {};
  for (const h of Object.values(hunts)) {
    const q = quarries[h.quarry];
    for (const tr of h.tracks) {
      const tier = trackTier(tr);
      const legal = owned
        .filter((id) => trackBlock(s, id, tr) === null)
        .sort((a, b) => level(b) - level(a));
      if (legal.length < 4) {
        track[tr.id] = null;
        continue;
      }
      const win = (p: HunterId[], n: number, tag: string): number => {
        const prep = eventPrep(s, p, q);
        let w = 0;
        for (let i = 0; i < n; i++) {
          const f = runFight({
            party: p.map((x) => snapshotOf(s, x)),
            monster: { event: h.quarry, tier },
            location: null,
            rolls: seeded(`cal-${tag}-${tr.id}-${i}`),
            log: false,
            prep,
            alchemy,
          });
          if (f.result === 'win') w += 1;
        }
        return w;
      };
      let best: { p: HunterId[]; w: number } | null = null;
      let n = 0;
      for (const p of combos(legal, 4)) {
        if (n++ >= MAX_COMBOS) break;
        const w = win(p, PICK_SAMPLES, 'pick');
        if (!best || w > best.w) best = { p, w };
      }
      track[tr.id] = win(best?.p ?? legal.slice(0, 4), FINAL_SAMPLES, 'final') / FINAL_SAMPLES;
    }
  }
  return { boss, track };
};

const report = (): void => {
  say(`# Event calibration (one-off, plan T9.13): medians over ${SEEDS.length} seeds\n`);
  say(
    `boss.poolBase now ${num('boss.poolBase')}; pools ${poolAtTier(4)} (tier 4), ${poolAtTier(5)} (tier 5).\n`,
  );
  const all: Record<string, Measured[]> = {};
  for (const kind of KINDS) {
    all[kind] = SEEDS.flatMap((seed) => {
      const file = snapPath(seed, kind);
      if (!existsSync(file)) return [];
      return [measure(JSON.parse(readFileSync(file, 'utf8')) as GameState)];
    });
  }
  say('## Median damage per boss attempt (and attempts to kill the sketch pool)\n');
  say('| Boss · tier | ' + KINDS.map((k) => LABEL[k]).join(' | ') + ' |');
  say('|---|' + KINDS.map(() => '---').join('|') + '|');
  for (const id of BOSS_IDS)
    for (const tier of [4, 5]) {
      const cells = KINDS.map((k) => {
        const m = median((all[k] ?? []).map((x) => x.boss[id]?.[tier] ?? 0));
        return `${m} (${m > 0 ? (poolAtTier(tier) / m).toFixed(0) : '∞'})`;
      });
      say(`| ${id} · ${tier} | ${cells.join(' | ')} |`);
    }
  say(
    '\n## Track win rate, best legal party (median over the seeds that have a party; seeds with one)\n',
  );
  say('| Track | ' + KINDS.map((k) => LABEL[k]).join(' | ') + ' |');
  say('|---|' + KINDS.map(() => '---').join('|') + '|');
  for (const h of Object.values(hunts))
    for (const tr of h.tracks) {
      const cells = KINDS.map((k) => {
        const rates = (all[k] ?? [])
          .map((x) => x.track[tr.id])
          .filter((r): r is number => r !== null && r !== undefined);
        return rates.length === 0
          ? '–'
          : `${median(rates.map((r) => r * 100)).toFixed(0)}% (${rates.length})`;
      });
      say(`| ${tr.id} · tier ${trackTier(tr)} | ${cells.join(' | ')} |`);
    }
  writeFileSync(out, `${lines.join('\n')}\n`);
  console.log(`\nWritten to ${out}`);
};

// CAL_HEALTH="stoneback-fell-troll:1.5,likho-one-eyed:2" scales a quarry's Health in memory only, to
// search for a value before it is written to the content file.
for (const part of (process.env.CAL_HEALTH ?? '').split(',').filter(Boolean)) {
  const [id, k] = part.split(':');
  const q = quarries[id as keyof typeof quarries] as { health: number };
  if (q) q.health = Math.round(q.health * Number(k));
}

if (mode === 'snap' || mode === 'both') play5();
if (mode === 'measure' || mode === 'both') report();
