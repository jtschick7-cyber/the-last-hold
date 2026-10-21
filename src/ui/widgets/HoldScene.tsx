import { COSMETIC_IDS } from '../../content/delves/shop';
import { cosmeticId, holdLookId, holdSceneId } from '../../content/assets';
import type { AgeId } from '../../content/ages';
import { holdLook } from '../../core/story/remembering-view';
import { game } from '../app/runtime';
import { Sprite } from './Sprite';

// GDD §9.12, §5.10.8: the hold scene, with the cosmetics bought with Riftglass stacked on it.
// Each cosmetic is a transparent layer the size of the scene, drawn for the Rank (plan T7.12).
export const HoldScene = ({ age }: { age: AgeId }) => {
  const bought = game().delve.shop.cosmetics;
  const look = holdLook(game());
  return (
    <span style={{ position: 'relative', display: 'inline-block', lineHeight: 0 }}>
      <Sprite id={holdSceneId(age)} scale={2} />
      {COSMETIC_IDS.filter((c) => bought.includes(c)).map((c) => (
        <span key={c} style={{ position: 'absolute', left: 0, top: 0 }}>
          <Sprite id={cosmeticId(c, age)} scale={2} />
        </span>
      ))}
      {/* GDD §5.15.6: the frost, then the lamp; on top of the cosmetics so the lamp is never hidden. */}
      {look !== 'plain' && (
        <span style={{ position: 'absolute', left: 0, top: 0 }}>
          <Sprite id={holdLookId(look, age)} scale={2} />
        </span>
      )}
    </span>
  );
};
