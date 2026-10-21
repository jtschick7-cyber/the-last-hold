// GDD §5.13 (v0.10, D408–D416): the four Orders and the sources of their standing. The display
// names, titles and texts come at T10.9–T10.10, word for word from lore §33. The list order is
// the order everything is shown, seated and read in (technical design §5.2).
export const ORDER_IDS = ['moot', 'greyWives', 'bellWatchers', 'quenchers'] as const;
export type OrderId = (typeof ORDER_IDS)[number];

/** The four Orders' names (GDD §5.13, D413; the setting primer and lore §14 already use them). */
export const ORDER_NAMES: Record<OrderId, string> = {
  moot: "Thanes' Moot",
  greyWives: 'Grey Wives',
  bellWatchers: 'Bell-Watchers',
  quenchers: 'the Quenchers',
};

/** Level 1 to 4 (GDD §5.13.2, D416 (7)): not village trust's words. */
export const ORDER_LEVEL_WORDS = ['Neighbour', 'Friend', 'Ally', 'Kin'] as const;

/** What adds standing to each Order (GDD §5.13.2). The weights are in `balance.ts` from T10.2. */
export const ORDER_SOURCES = {
  moot: ['contract'],
  greyWives: ['brew', 'experiment', 'property'],
  bellWatchers: ['document', 'letter', 'name'],
  quenchers: ['kozlyContract', 'delveFloor'],
} as const satisfies Record<OrderId, readonly string[]>;
