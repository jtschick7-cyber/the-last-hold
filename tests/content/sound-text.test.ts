// GDD §9.22: the approved strings are in the code exactly as in the GDD, and nothing else is.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import * as text from '../../src/content/sound-text';
import {
  SETTING_AMBIENCE_HELP,
  SETTING_AMBIENCE_LABEL,
  SETTING_AMBIENCE_OFF,
  SETTING_AMBIENCE_ON,
  SOUND_BUTTONS,
  SOUND_HELP,
  SOUND_LABEL,
} from '../../src/content/sound-text';

const gdd = readFileSync(new URL('../../docs/gdd.md', import.meta.url), 'utf8');
const section = gdd.slice(gdd.indexOf('### 9.22 Sounds of the Frontier'));

describe('sound strings', () => {
  it('match the GDD §9.22 table word for word', () => {
    expect(section).toContain(`| \`${SOUND_LABEL}\` |`);
    expect(section).toContain(`| \`[${SOUND_BUTTONS.on}] [${SOUND_BUTTONS.off}]\` |`);
    expect(section).toContain(`| \`${SOUND_HELP}\` |`);
  });

  // v1.7 (D609, D610): the Ambience row shares the [On] [Off] buttons and has its own label and help.
  it('the Ambience row matches the GDD §9.22 table word for word', () => {
    expect(SETTING_AMBIENCE_LABEL).toBe('Ambience');
    expect(section).toContain(`| \`${SETTING_AMBIENCE_LABEL}\` |`);
    expect(section).toContain(`| \`[${SETTING_AMBIENCE_ON}] [${SETTING_AMBIENCE_OFF}]\` |`);
    expect(section).toContain(`| \`${SETTING_AMBIENCE_HELP}\` |`);
    expect(SETTING_AMBIENCE_HELP).toBe(
      "Quiet hearth fire and frontier wind while the hold is open. Silent during the Remembering, and muted by your phone's silent switch.",
    );
  });

  it('holds no strings beyond the approved ones', () => {
    expect(Object.keys(text).sort()).toEqual(
      [
        'SETTING_AMBIENCE_HELP',
        'SETTING_AMBIENCE_LABEL',
        'SETTING_AMBIENCE_OFF',
        'SETTING_AMBIENCE_ON',
        'SOUND_BUTTONS',
        'SOUND_HELP',
        'SOUND_LABEL',
      ].sort(),
    );
  });
});
