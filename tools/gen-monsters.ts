// Writes the committed portrait PNGs; the drawing lives in draw-monster.ts so tests can reuse it.
// Run: npx vite-node tools/gen-monsters.ts
import { mkdirSync, writeFileSync } from 'node:fs';
import { MONSTER_IDS } from '../src/content/monsters';
import { drawMonster } from './draw-monster';

const out = new URL('../public/assets/portraits/', import.meta.url);
mkdirSync(out, { recursive: true });
for (const id of MONSTER_IDS) {
  writeFileSync(new URL(`monster-${id}.png`, out), drawMonster(id).toPng());
  console.log(`portrait.monster.${id} → public/assets/portraits/monster-${id}.png`);
}
