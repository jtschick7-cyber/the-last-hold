import { buildHoldGridView } from '../../core/systems/layout';
import { game, version } from '../app/runtime';

// Plan TL.8 builds the Arrange Hold sheet (GDD §9.21). Until then [Layout ▸] opens this: only the
// tray line, so the button is not dead and the badge's number can be checked.
export const ArrangeHoldSheet = () => {
  void version.value;
  return <p data-arrange-hold="true">TRAY (unplaced: {buildHoldGridView(game()).tray.length})</p>;
};
