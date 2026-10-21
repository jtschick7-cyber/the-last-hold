// lore-secrets §34.6 (v0.11, D446–D467), word for word: the Orders' cards in the ending. Which of
// them shows is worked out from what was read (`core/story/ending-orders.ts`), never from current
// seats or levels (D419). No card names the Sent.

import { ORDER_NAMES, type OrderId } from '../orders';

/** The sheet's title is the Order's own name (already collision-checked), capitalised. */
const orderTitle = (id: OrderId): string => ORDER_NAMES[id].replace(/^./, (c) => c.toUpperCase());

export type EndingOrderCardId =
  | 'mootA'
  | 'mootB'
  | 'greyWives'
  | 'bellWatchers'
  | 'quenchersA'
  | 'quenchersB'
  | 'quenchersFallback';

export interface EndingOrderCard {
  readonly id: 'R-05' | 'R-06' | 'R-07' | 'R-08';
  readonly title: string;
  readonly paragraphs: readonly string[];
}

export const endingOrderTexts: Readonly<Record<EndingOrderCardId, EndingOrderCard>> = {
  mootA: {
    id: 'R-05',
    title: orderTitle('moot'),
    paragraphs: [
      'Marta Dubska has come up with the other heads, and Bohdan Kozel has come with them. Nobody arranged it. The chair Brana set at the head of the table is still empty. Marta rests a hand on the back of it as she goes by, and takes the hand away again, and says nothing.',
    ],
  },
  mootB: {
    id: 'R-05',
    title: orderTitle('moot'),
    paragraphs: [
      'Marta Dubska has come up with Gunnar, Ilona and Sólveig. There is a chair for Kozly Hollow at the end of the table, and she has had it set, though nobody expects it to be filled. "It stands there," she says, to nobody. "Somebody can use it if they\'ve a mind."',
    ],
  },
  greyWives: {
    id: 'R-06',
    title: orderTitle('greyWives'),
    paragraphs: [
      'The eldest Grey Wife has come up with Vesna. The cup she left on the table by the kettles is still there. She looks into it. It is empty, and rinsed.',
      '"Well," she says. "Somebody came."',
      'Vesna looks at Brana. Brana looks at the ceiling.',
    ],
  },
  bellWatchers: {
    id: 'R-07',
    title: orderTitle('bellWatchers'),
    paragraphs: [
      "Halina has come up from Mirograd and stopped under the gatehouse arch. The bell is where Brana hung it, the cloth lying on the stone beneath. She looks at the roll in Ilse's hands. Then she reaches up and strikes the bell with the flat of her hand, once.",
      'It carries a long way down the valley. Dana Lisová lays her own hand on the bronze to still it, and is the last to take it away.',
    ],
  },
  quenchersA: {
    id: 'R-08',
    title: orderTitle('quenchers'),
    paragraphs: [
      'At dusk the lamps go into the windows in Kozly Hollow, house by house. Bohdan Kozel sets one in the fourth window, the one that faces the road up to the hold. Then he comes out and stands in the road with his cap on.',
      '"I said it to the heads, and they heard it," he says. "I can light a window to that."',
    ],
  },
  quenchersB: {
    id: 'R-08',
    title: orderTitle('quenchers'),
    paragraphs: [
      'At dusk the lamps go into the windows in Kozly Hollow, house by house. Bohdan Kozel sets one in the fourth window, the one that faces the road up to the hold. Then he comes out and stands in the road with his cap on.',
      '"The stone never warmed in my hand," he says. "The stove does. I\'ll light the window. I\'ll not stop asking what it costs, mind."',
    ],
  },
  quenchersFallback: {
    id: 'R-08',
    title: orderTitle('quenchers'),
    paragraphs: [
      'Věra has come up from Kozly Hollow with the others. "The Hollow is still making up its mind," she says. "Bohdan has a window that faces this road. If it\'s dark, don\'t take it for an answer."',
    ],
  },
};
