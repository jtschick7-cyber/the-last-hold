import type { StandResult } from '../../../src/core/stand/engine';

/** One line per wave header and per fight log entry: what "line for line" compares (technical design §23.4). */
export const standLines = (result: StandResult): string[] =>
  result.waves.flatMap((w, i) => [
    `wave ${i + 1}: ${w.fight.result}${w.breach ? ` · ${w.breach.header}` : ''}`,
    ...w.fight.log.map((e) => JSON.stringify(e)),
  ]);
