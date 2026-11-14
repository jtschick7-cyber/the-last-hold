// Plan T18.6 & T18.7 (GDD §9.21, §9.26): every v1.8 string in V18_TEXT matches the GDD §9.26
// table word-for-word (and vice versa), and every reconciled Arrange Hold v1.8 string in
// ARRANGE_TEXT matches GDD §9.21's table word-for-word.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ARRANGE_TEXT, V18_TEXT } from '../../src/content/v18-text';

const gdd = readFileSync(new URL('../../docs/gdd.md', import.meta.url), 'utf8');

const extractTableStrings = (heading: string, endMarker: string) => {
  const start = gdd.indexOf(heading);
  expect(start, heading).toBeGreaterThan(-1);
  const end = gdd.indexOf(endMarker, start);
  expect(end, endMarker).toBeGreaterThan(start);
  const section = gdd.slice(start, end);
  const rows = section
    .slice(section.indexOf('| String | Where it shows |'))
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.startsWith('|') && !l.startsWith('| String') && !l.startsWith('|---'));
  const strings = rows.flatMap((l) => {
    const first = l.split('|')[1] ?? '';
    return [...first.matchAll(/`([^`]+)`/g)].map((m) => m[1] as string);
  });
  return { rows, strings };
};

const s926 = extractTableStrings('### 9.26 Hold Look', '\n## 10.');
const s921 = extractTableStrings("### 9.21 The Hold's Layout", '\n### 9.22');

const built926: Record<keyof typeof V18_TEXT, string[]> = {
  holdLookButton: [V18_TEXT.holdLookButton],
  holdLookTitle: [V18_TEXT.holdLookTitle],
  holdLookIntro: [V18_TEXT.holdLookIntro],
  courtyardMarks: [V18_TEXT.courtyardMarks],
  riftglassShop: [V18_TEXT.riftglassShop],
  earnedSource: [V18_TEXT.earnedSource('{source}')],
  lockedSource: [V18_TEXT.lockedSource('{source}')],
  boughtShop: [V18_TEXT.boughtShop],
  buyShop: [V18_TEXT.buyShop],
  shown: [V18_TEXT.shown],
  hidden: [V18_TEXT.hidden],
  locked: [V18_TEXT.locked],
  holdTactics: [V18_TEXT.holdTactics],
  millLinks: [V18_TEXT.millLinks('{n}')],
  sawpitLinks: [V18_TEXT.sawpitLinks('{n}')],
  smithyLinks: [V18_TEXT.smithyLinks('{n}')],
  alchemistLinks: [V18_TEXT.alchemistLinks('{n}')],
  warmCottages: [V18_TEXT.warmCottages('{n}')],
  trophyLink: [V18_TEXT.trophyLink],
  wardedPlots: [V18_TEXT.wardedPlots('{n}')],
  wardedHearthHall: [V18_TEXT.wardedHearthHall],
  brewTime: [V18_TEXT.brewTime],
  experimentTime: [V18_TEXT.experimentTime],
  baseTime: [V18_TEXT.baseTime],
  connectedRampart: [V18_TEXT.connectedRampart('{p}')],
  screenedBonus: [V18_TEXT.screenedBonus('{p}')],
  sectorSupport: [V18_TEXT.sectorSupport('{p}')],
  rampartTag: [V18_TEXT.rampartTag('{p}')],
  sectorTag: [V18_TEXT.sectorTag('{p}')],
  screenedCount: [V18_TEXT.screenedCount('{n}')],
  waveLogDefenses: [V18_TEXT.waveLogDefenses],
};

const built921: Record<keyof typeof ARRANGE_TEXT, string[]> = {
  layoutMode: [ARRANGE_TEXT.layoutMode],
  modeBalanced: [ARRANGE_TEXT.modeBalanced],
  modeEconomy: [ARRANGE_TEXT.modeEconomy],
  modeFortress: [ARRANGE_TEXT.modeFortress],
  presets: [ARRANGE_TEXT.presets],
  slot: [ARRANGE_TEXT.slot('{n}')],
  empty: [ARRANGE_TEXT.empty],
  placedCount: [ARRANGE_TEXT.placedCount('{n}')],
  save: [ARRANGE_TEXT.save],
  apply: [ARRANGE_TEXT.apply],
  tacticsBar: [ARRANGE_TEXT.tacticsBar('{status}', '{n}', '{n}')],
  warded: [ARRANGE_TEXT.warded],
  exposed: [ARRANGE_TEXT.exposed],
  screened: [ARRANGE_TEXT.screened],
  linked: [ARRANGE_TEXT.linked('{n}')],
};

describe('v1.8 strings match GDD §9.26 and §9.21 word for word', () => {
  it('the §9.26 table has 28 rows and 31 strings', () => {
    expect(s926.rows).toHaveLength(28);
    expect(s926.strings).toHaveLength(31);
  });

  it('every string in V18_TEXT is in the §9.26 table and every table string is in V18_TEXT', () => {
    expect(Object.keys(V18_TEXT).sort()).toEqual(Object.keys(built926).sort());
    const tableSet = new Set(s926.strings);
    const codeList = Object.values(built926).flat();
    for (const s of codeList) expect(s926.strings, s).toContain(s);
    const codeSet = new Set(codeList);
    for (const s of tableSet) expect([...codeSet], s).toContain(s);
  });

  it('every reconciled v1.8 string in ARRANGE_TEXT is in the GDD §9.21 table', () => {
    expect(Object.keys(ARRANGE_TEXT).sort()).toEqual(Object.keys(built921).sort());
    for (const s of Object.values(built921).flat()) {
      expect(s921.strings, s).toContain(s);
    }
  });
});
