import { COSMETIC_IDS } from '../../content/delves/shop';
import { cosmeticId, holdSceneId } from '../../content/assets';
import type { AgeId } from '../../content/ages';
import { game } from '../app/runtime';
import { Sprite } from './Sprite';

// GDD §9.12, §5.10.8: the hold scene, with the cosmetics bought with Riftglass stacked on it.
// Each cosmetic is a transparent layer the size of the scene, drawn for the Rank (plan T7.12).
export const HoldScene = ({ age }: { age: AgeId }) => {
  const bought = game().delve.shop.cosmetics;
  return (
    <span style={{ position: 'relative', display: 'inline-block', lineHeight: 0 }}>
      <Sprite id={holdSceneId(age)} scale={2} />
      {COSMETIC_IDS.filter((c) => bought.includes(c)).map((c) => (
        <span key={c} style={{ position: 'absolute', left: 0, top: 0 }}>
          <Sprite id={cosmeticId(c, age)} scale={2} />
        </span>
      ))}
    </span>
  );
};
