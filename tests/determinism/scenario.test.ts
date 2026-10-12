// Technical design §14: the scenario the browsers also run (tests/e2e) is
// deterministic under Node: twice gives byte-identical output.
import { expect, it } from 'vitest';
import { runScenario } from './scenario';

it('the cross-engine scenario is deterministic in Node', () => {
  const a = runScenario();
  expect(a).toBe(runScenario());
  expect(a.length).toBeGreaterThan(1000);
});
