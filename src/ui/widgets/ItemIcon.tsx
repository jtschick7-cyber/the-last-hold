import type { GearId } from '../../content/gear';
import type { ItemRarity } from '../../content/items';
import { gearIconId, itemFrameId } from '../../content/assets';
import { Sprite } from './Sprite';

// GDD §9.16 (D324): an item's base icon (16 px) centred in its rarity frame (20 px), at 2×.
const SCALE = 2;
const FRAME = 20 * SCALE;
const ICON = 16 * SCALE;

export const ItemIcon = ({ gear, rarity }: { gear: GearId; rarity: ItemRarity }) => (
  <span
    style={{
      position: 'relative',
      display: 'inline-block',
      width: `${FRAME}px`,
      height: `${FRAME}px`,
      flex: 'none',
    }}
  >
    <Sprite id={itemFrameId(rarity)} scale={SCALE} />
    <span
      style={{
        position: 'absolute',
        left: `${(FRAME - ICON) / 2}px`,
        top: `${(FRAME - ICON) / 2}px`,
      }}
    >
      <Sprite id={gearIconId(gear)} scale={SCALE} />
    </span>
  </span>
);
