import { RULES_VERSION } from '../core/rules-version';
import { SCHEMA_VERSION } from '../core/state/game-state';
import { buildInfo } from './build-info';
import type { SideList } from './side-store';

// Technical design §15.1: in every build, errors are captured into a list of the
// last 50, under their own key so a bad save can't erase them.
export const DIAGNOSTICS_KEEP = 50;
const COPY_LAST = 20;

export interface CapturedError {
  message: string;
  stack: string;
  time: number;
  screen: string;
}

export const captureErrors = (list: SideList<CapturedError>, screen: () => string): void => {
  const record = (message: string, stack: string): void =>
    list.push({ message, stack, time: Date.now(), screen: screen() });
  window.addEventListener('error', (e) =>
    record(e.message, e.error instanceof Error ? (e.error.stack ?? '') : ''),
  );
  window.addEventListener('unhandledrejection', (e) => {
    const r: unknown = e.reason;
    record(r instanceof Error ? r.message : String(r), r instanceof Error ? (r.stack ?? '') : '');
  });
};

/** Plain text to paste into a session (technical design §15.1). */
export const diagnosticsText = (errors: CapturedError[], saveCode: string): string =>
  [
    'The Last Hold — diagnostics',
    `Version ${buildInfo.version} · ${buildInfo.channel} · ${buildInfo.branch} @ ${buildInfo.commit}`,
    `schemaVersion ${SCHEMA_VERSION} · rulesVersion ${RULES_VERSION}`,
    `User agent: ${navigator.userAgent}`,
    `Copied: ${new Date().toISOString()}`,
    '',
    `Last ${Math.min(COPY_LAST, errors.length)} errors (newest first):`,
    ...errors.slice(0, COPY_LAST).flatMap((e) => [
      `- ${new Date(e.time).toISOString()} [${e.screen}] ${e.message}`,
      ...e.stack
        .split('\n')
        .slice(0, 6)
        .map((l) => `    ${l}`),
    ]),
    '',
    'Save code:',
    saveCode,
  ].join('\n');
