import { useState } from 'preact/hooks';
import { assetById, SPRITE_FRAME_NAMES, type SpriteFrameName } from '../../content/assets';
import css from './BattleSprite.module.css';
import { Sprite } from './Sprite';

// GDD §9.12 (D265): shows one frame of a battle sprite's strip at 2×, or, for the idle, the two
// idle frames in turn. A sprite that is missing or fails to load falls back to the 64 px
// portrait, and a guardian (which has none) to the placeholder, so a screen never breaks.
const BASE = `${import.meta.env.BASE_URL}assets/`;
const SCALE = 2;
const FRAME_PX = 32 * SCALE;

export interface BattleSpriteProps {
  id: string;
  portraitId?: string | null;
  frame?: SpriteFrameName | 'idling';
  label: string;
}

export const BattleSprite = ({ id, portraitId, frame = 'idling', label }: BattleSpriteProps) => {
  const entry = assetById.get(id);
  const [broken, setBroken] = useState(false);
  if (!entry || entry.source === 'placeholder' || broken) {
    return (
      <span class={css.box} role="img" aria-label={label}>
        {portraitId && assetById.get(portraitId)?.source === 'generated' ? (
          <Sprite id={portraitId} />
        ) : (
          <Sprite id={id} scale={2} />
        )}
      </span>
    );
  }
  const index = frame === 'idling' ? 0 : SPRITE_FRAME_NAMES.indexOf(frame);
  return (
    <span class={css.box} role="img" aria-label={label}>
      <img
        class={`${css.strip} ${frame === 'idling' ? css.idle : ''}`}
        src={BASE + entry.file}
        alt=""
        style={frame === 'idling' ? undefined : { transform: `translateX(-${index * FRAME_PX}px)` }}
        onError={() => setBroken(true)}
      />
    </span>
  );
};
