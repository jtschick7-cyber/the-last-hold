// Plan TV.5 (GDD §9.20, technical design §18.3): the two scans behind the reduced-motion rule.

/**
 * Every `animation` / `transition` declaration (other than `none`) must sit inside the gate:
 * `@media (prefers-reduced-motion: no-preference)` and a selector with `:not([data-motion='on'])`.
 * Returns one line per declaration that does not.
 */
export const ungatedMotion = (css: string): string[] => {
  const text = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const stack: string[] = [];
  const found: string[] = [];
  let buffer = '';
  for (const ch of text) {
    if (ch === '{') {
      stack.push(buffer.trim().replace(/\s+/g, ' '));
      buffer = '';
    } else if (ch === '}') {
      stack.pop();
      buffer = '';
    } else if (ch === ';') {
      const m = /^\s*(animation|transition)(-[a-z-]+)?\s*:\s*(.+)$/.exec(buffer);
      if (m && m[3]?.replace(/!important/, '').trim() !== 'none') {
        const gated =
          stack.some((s) => s.includes('prefers-reduced-motion: no-preference')) &&
          stack.some((s) => s.includes(":not([data-motion='on'])"));
        if (!gated) found.push(`${stack.at(-1) ?? '(top level)'} { ${buffer.trim()} }`);
      }
      buffer = '';
    } else buffer += ch;
  }
  return found;
};

const BANNED: readonly RegExp[] = [
  /\bsetInterval\s*\(/,
  /\brequestAnimationFrame\s*\(/,
  /\.animate\s*\(/,
  /\banimation\s*:/,
  /\btransition\s*:/,
];

/**
 * JS-driven motion (timers, frames, the Web Animations API, inline CSS motion) may only be created
 * in the registry. A line that really is not motion says so with `// not motion` on it or just above.
 */
export const motionOutsideRegistry = (source: string): string[] => {
  const lines = source.split('\n');
  const found: string[] = [];
  lines.forEach((line, i) => {
    if (!BANNED.some((re) => re.test(line))) return;
    if (/\/\/\s*not motion/.test(line) || /\/\/\s*not motion/.test(lines[i - 1] ?? '')) return;
    found.push(`${i + 1}: ${line.trim()}`);
  });
  return found;
};
