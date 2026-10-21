// GDD §5.12.1 (D366): the one-time scene when events first open at the Citadel, word for word.
export const eventsScene = {
  heading: 'Three notes from the gate',
  paragraphs: [
    'Brana comes up from the gate with three notes folded in her fist. "Velkvik, Ravenfell and Mirograd, all in the one week," she says. "A thing in the fjord, a thing under the barrows, a thing in the river. They aren\'t asking for contracts. They\'re asking for you."',
    'She sets a fourth note on the table, the paper gone soft as cloth. "And this is the Ford\'s grandmothers, asking for the old hunters. They say the stories are true if you tell them in the right order."',
    'Pechko, from behind the stove, without turning: "Take four. Rest them a day. Big things don\'t hurry."',
  ],
} as const;

/** GDD §9.17: card and sheet wording. */
export const eventsLines = {
  locked: 'Events wait for the Citadel.',
  everyoneResting: (readyIn: string): string =>
    `Everyone is resting. The next is ready in ${readyIn}.`,
  nobodyFree: "Nobody is free to go. Hunters on a contract, in a Delve or recovering can't attend.",
  noToken: 'No attempt token in the bank.',
} as const;
