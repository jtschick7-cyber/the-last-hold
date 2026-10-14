import type { Band } from '../../content/story/scenes';
import { num } from '../balance-access';

// GDD §5.14.8 (D145): every stand gets a band from the waves it held: Broken below
// `band.heldFrom`, Held below `band.triumphantFrom`, Triumphant from it.
export const bandFor = (wavesHeld: number): Band =>
  wavesHeld >= num('band.triumphantFrom')
    ? 'triumphant'
    : wavesHeld >= num('band.heldFrom')
      ? 'held'
      : 'broken';
