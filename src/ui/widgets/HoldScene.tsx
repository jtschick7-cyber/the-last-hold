import { COSMETIC_IDS } from '../../content/delves/shop';
import { cosmeticId, holdLookId, holdSceneId } from '../../content/assets';
import type { AgeId } from '../../content/ages';
import { visibleCourtyardMarks, visibleShopCosmetics } from '../../core/systems/cosmetics';
import { holdLook } from '../../core/story/remembering-view';
import { game } from '../app/runtime';
import { CourtyardMarkAccents } from './CourtyardMarkAccents';
import { Sprite } from './Sprite';

// GDD §9.12, §5.10.8, §9.26: the hold scene with visible Riftglass cosmetics and Courtyard Marks.
export const HoldScene = ({ age }: { age: AgeId }) => {
  const s = game();
  const visibleCosmetics = visibleShopCosmetics(s);
  const marks = visibleCourtyardMarks(s);
  const look = holdLook(s);
  return (
    // Never wider than its card: at 320 px the 2x scene (320 px) was wider than the page (TV.3b),
    // so it scales down with the card and stays full size where there is room.
    <span
      data-hold-scene="true"
      data-courtyard-marks={marks.join(',')}
      style={{
        position: 'relative',
        display: 'block',
        width: '100%',
        maxWidth: '320px',
        margin: '0 auto',
        lineHeight: 0,
      }}
    >
      <Sprite id={holdSceneId(age)} fill />
      {COSMETIC_IDS.filter((c) => visibleCosmetics.includes(c)).map((c) => (
        <span
          key={c}
          data-cosmetic={c}
          style={{ position: 'absolute', left: 0, top: 0, width: '100%' }}
        >
          <Sprite id={cosmeticId(c, age)} fill />
        </span>
      ))}
      <CourtyardMarkAccents marks={marks} variant="scene" />
      {/* GDD §5.15.6: the frost, then the lamp; on top of the cosmetics so the lamp is never hidden. */}
      {look !== 'plain' && (
        <span
          data-lamp={look === 'lamp' ? 'hearth' : undefined}
          data-frost={look === 'frost' ? 'hold' : undefined}
          style={{ position: 'absolute', left: 0, top: 0, width: '100%' }}
        >
          <Sprite id={holdLookId(look, age)} fill />
        </span>
      )}
    </span>
  );
};
