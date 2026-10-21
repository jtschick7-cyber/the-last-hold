// GDD §5.13 (v0.10, D408–D416): the four Orders and the sources of their standing. The display
// names, titles and texts come at T10.9–T10.10, word for word from lore §33. The list order is
// the order everything is shown, seated and read in (technical design §5.2).
export const ORDER_IDS = ['moot', 'greyWives', 'bellWatchers', 'quenchers'] as const;
export type OrderId = (typeof ORDER_IDS)[number];

/** What adds standing to each Order (GDD §5.13.2). The weights are in `balance.ts` from T10.2. */
export const ORDER_SOURCES = {
  moot: ['contract'],
  greyWives: ['brew', 'experiment', 'property'],
  bellWatchers: ['document', 'letter', 'name'],
  quenchers: ['kozlyContract', 'delveFloor'],
} as const satisfies Record<OrderId, readonly string[]>;
