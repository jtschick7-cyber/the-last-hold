// Writes docs/credits.md (technical design §12.4). Run: npx vite-node tools/gen-credits.ts
import { writeFileSync } from 'node:fs';
import { buildCredits } from '../src/core/credits';

writeFileSync(new URL('../docs/credits.md', import.meta.url), buildCredits());
console.log('wrote docs/credits.md');
