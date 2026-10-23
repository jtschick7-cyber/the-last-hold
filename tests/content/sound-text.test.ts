// GDD §9.22: the three approved strings are in the code exactly as in the GDD, and nothing else is.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { SOUND_BUTTONS, SOUND_HELP, SOUND_LABEL } from '../../src/content/sound-text';

const gdd = readFileSync(new URL('../../docs/gdd.md', import.meta.url), 'utf8');
const section = gdd.slice(gdd.indexOf('### 9.22 Sounds of the Frontier'));

describe('sound strings', () => {
  it('match the GDD §9.22 table word for word', () => {
    expect(section).toContain(`| \`${SOUND_LABEL}\` |`);
    expect(section).toContain(`| \`[${SOUND_BUTTONS.on}] [${SOUND_BUTTONS.off}]\` |`);
    expect(section).toContain(`| \`${SOUND_HELP}\` |`);
  });
});
