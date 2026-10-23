// D521 (5): the phone's silent switch is respected. iOS Safari lets a page say how its sound is
// treated (the Audio Session API); "ambient" is the type that follows the silent switch and mixes
// with other apps' audio. This is not a trick around the switch: it is the opposite of one.
interface AudioSessionLike {
  type: string;
}

/** Declares the page's audio as ambient where the browser supports it; returns whether it did. */
export const declareAmbient = (nav: object): boolean => {
  try {
    const session = (nav as { audioSession?: AudioSessionLike }).audioSession;
    if (!session) return false;
    session.type = 'ambient';
    return session.type === 'ambient';
  } catch {
    return false;
  }
};
