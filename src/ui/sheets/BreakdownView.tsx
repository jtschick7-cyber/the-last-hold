import type { Breakdown } from '../../core/breakdown/breakdown';
import { formatExact } from '../../core/format';
import css from './Breakdown.module.css';

// Technical design §5.4: one generic view renders any breakdown tree, showing
// exact values, the formula, and the GDD §7 key behind each constant.
const Node = ({ b, depth }: { b: Breakdown; depth: number }) => (
  <li class={css.node}>
    <div class={css.line}>
      <span class={css.label}>{b.label}</span>
      <span class={css.value}>{formatExact(b.value)}</span>
    </div>
    {(b.formula || b.key) && (
      <div class={css.meta}>
        {b.formula && <span>{b.formula}</span>}
        {b.key && <code class={css.key}>{b.key}</code>}
      </div>
    )}
    {b.children && b.children.length > 0 && (
      <ul class={css.children}>
        {b.children.map((c, i) => (
          <Node key={i} b={c} depth={depth + 1} />
        ))}
      </ul>
    )}
  </li>
);

export const BreakdownView = ({ breakdown }: { breakdown: Breakdown }) => (
  <ul class={css.tree}>
    <Node b={breakdown} depth={0} />
  </ul>
);
