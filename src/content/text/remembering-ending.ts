// lore-secrets §34.6–34.7 (v0.11, D446–D467), word for word: the cards of the ending that follow the
// reading, apart from the Orders' cards (remembering-orders.ts). No card names the Sent.

export interface EndingCard {
  readonly id: 'R-04' | 'R-04b' | 'R-09' | 'R-11';
  readonly title: string;
  readonly paragraphs: readonly string[];
}

export const endingCount: EndingCard = {
  id: 'R-04',
  title: 'The count',
  paragraphs: [
    'The frost on the floor draws back toward the crack, the way a tide goes out. It does not take long.',
    'Ilse closes the roll. Her fingers have left marks in the cover.',
    '"That\'s the count," says Pechko. He sounds like a man who has been told the bread is done. "Aye. That\'s the count."',
    'Where the frost was, there is a damp patch on a flagstone. Brana puts her boot on it by accident, and apologises to it.',
  ],
};

export const endingFortieth: EndingCard = {
  id: 'R-04b',
  title: 'The fortieth',
  paragraphs: [
    "Sigrun is at the back of the Hall, without her lantern. She heard her own name last, with the year she was meant to go, and she hasn't moved since.",
    '"It\'s strange, being counted for something I didn\'t do," she says. "It\'s stranger to be counted right."',
  ],
};

export const endingHearthKeeps: EndingCard = {
  id: 'R-09',
  title: 'The hearth keeps itself',
  paragraphs: [
    "\"You'll want to know about the stove,\" Pechko says. \"It's keeping itself. Don't ask me how. I've never seen it do that. Wardens will still come and go. They always did. Old habit, and a good one. I'd not take it from them.\"",
  ],
};

export const endingWarm: EndingCard = {
  id: 'R-11',
  title: 'It is warm where I am',
  paragraphs: [
    '— in rime, on the Hearth Hall floor —',
    'It is warm where I am. I had forgotten it could be.',
    'Keep the roll where people can find it. Read it again whenever you like; I will hear it.',
    'I am not asking for anything now.',
  ],
};

/** Ilse's note under R-11 (lore §34.7). */
export const endingWarmNote = 'The rime is gone from the floor. I copied it first.';
