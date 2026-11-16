import { courtyardMarkAssetId } from '../../content/assets';
import type { CourtyardMarkId } from '../../content/courtyard-marks';
import { Sprite } from './Sprite';

// Plan T18.11 (Q83(a), Q84(a), Q85(a), D622, D623): renders the 16 × 16 Zughy-32 pixel PNG
// Courtyard Marks at exact 1× native proportion across both HoldGrid (256 × 384) and
// HoldScene (160 × 64), static under Reduce Motion and layered beside shop cosmetics.

type Point = readonly [number, number];

const MARK_PX = 16;

const GRID_ANCHORS: Readonly<Record<CourtyardMarkId, Point>> = {
  'barrow-brazier': [10, 6],
  'kettle-barrow-wreath': [230, 6],
  'stoneback-cairn': [4, 184],
  'watch-fire-sconce': [236, 184],
  'fjord-bone-standard': [8, 356],
  'river-reed-basin': [230, 358],
};

const SCENE_ANCHORS: Readonly<Record<CourtyardMarkId, Point>> = {
  'fjord-bone-standard': [12, 34],
  'barrow-brazier': [34, 42],
  'stoneback-cairn': [56, 44],
  'kettle-barrow-wreath': [96, 42],
  'river-reed-basin': [116, 44],
  'watch-fire-sconce': [136, 36],
};

/** Static 16 × 16 Zughy-32 pixel-art Courtyard Mark overlay for Grid (256 × 384) and Scene (160 × 64). */
export const CourtyardMarkAccents = ({
  marks,
  variant,
}: {
  readonly marks: readonly CourtyardMarkId[];
  readonly variant: 'grid' | 'scene';
}) => {
  if (marks.length === 0) return null;
  const w = variant === 'grid' ? 256 : 160;
  const h = variant === 'grid' ? 384 : 64;
  const anchors = variant === 'grid' ? GRID_ANCHORS : SCENE_ANCHORS;
  return (
    <div
      aria-hidden="true"
      data-courtyard-marks-layer={variant}
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        lineHeight: 0,
      }}
    >
      {marks.map((id) => {
        const [x, y] = anchors[id];
        return (
          <span
            key={id}
            data-courtyard-mark={id}
            style={{
              position: 'absolute',
              left: `${(x / w) * 100}%`,
              top: `${(y / h) * 100}%`,
              width: `${(MARK_PX / w) * 100}%`,
              height: `${(MARK_PX / h) * 100}%`,
              lineHeight: 0,
            }}
          >
            <Sprite id={courtyardMarkAssetId(id)} fill />
          </span>
        );
      })}
    </div>
  );
};
