import { runScenario } from '../determinism/scenario';

// Runs the shared scenario in this browser and exposes the result to Playwright.
const out = document.getElementById('out');
const result = runScenario();
(window as unknown as { __scenario: string }).__scenario = result;
if (out) out.textContent = `done: ${result.length} characters`;
