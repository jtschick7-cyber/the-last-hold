// Technical design §14: the scenario the browsers also run (tests/e2e) is
// deterministic under Node: twice gives byte-identical output.
import { expect, it } from 'vitest';
import { runScenario } from './scenario';

// Two runs take about 3.7 s alone, so the default 5 s limit fails under a loaded full-suite run
// (seen at v0.7): a longer limit, the assertions unchanged.
it('the cross-engine scenario is deterministic in Node', () => {
  const a = runScenario();
  expect(a).toBe(runScenario());
  expect(a.length).toBeGreaterThan(1000);
}, 30_000);
