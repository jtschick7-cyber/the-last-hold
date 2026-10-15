// PreToolUse hook (Bash): before a `git commit`, run typecheck and lint and block the
// commit if either fails. Fast checks only; the full `npm run check` stays the rule in
// CLAUDE.md and CI. Fails open: if the input can't be read, the command is allowed.
import { spawnSync } from 'node:child_process';

let input = '';
for await (const chunk of process.stdin) input += chunk;

let command = '';
try {
  command = String(JSON.parse(input)?.tool_input?.command ?? '');
} catch {
  process.exit(0);
}

// A real `git commit` at the start of a command or after ; && || | ( — not `git commit-tree`,
// and not text inside an argument such as a commit message.
const isCommit = /(^|[;&|(]\s*|&&\s*)git(\s+-[^\s]+(\s+[^\s-][^\s]*)?)*\s+commit(\s|$)/m;
if (!isCommit.test(command)) process.exit(0);

const dir = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
const r = spawnSync('npm run typecheck && npm run lint', {
  cwd: dir,
  shell: true,
  encoding: 'utf8',
});
if (r.status === 0) process.exit(0);
process.stderr.write(
  `Commit blocked: typecheck or lint failed. Fix it, then commit again.\n${r.stdout}${r.stderr}`,
);
process.exit(2);
