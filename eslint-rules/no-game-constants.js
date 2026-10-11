// Technical design §5.1 (plan review A14): every numeric game constant lives in
// src/content/balance.ts. In core/systems/ only a small allowlist of literals is
// permitted: 0, 1, -1 (unary minus on 1), 2, 100, and array indices.
const ALLOWED = new Set([0, 1, 2, 100]);

export const noGameConstants = {
  meta: {
    type: 'problem',
    docs: { description: 'Numeric game constants belong in src/content/balance.ts' },
    messages: {
      literal:
        'Numeric literal {{raw}} in core/systems/. Move it to src/content/balance.ts under its GDD §7 key.',
    },
    schema: [],
  },
  create(context) {
    return {
      Literal(node) {
        if (typeof node.value !== 'number' && typeof node.value !== 'bigint') return;
        const parent = node.parent;
        // Array indices (xs[3]) are positions, not game constants.
        if (
          parent &&
          parent.type === 'MemberExpression' &&
          parent.computed &&
          parent.property === node
        )
          return;
        // Literal types (type Tier = 1 | 2 | 3) describe shapes, not values.
        if (parent && parent.type === 'TSLiteralType') return;
        if (ALLOWED.has(Number(node.value))) return;
        context.report({ node, messageId: 'literal', data: { raw: node.raw } });
      },
    };
  },
};
