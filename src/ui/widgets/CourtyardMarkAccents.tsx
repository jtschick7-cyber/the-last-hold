import type { CourtyardMarkId } from '../../content/courtyard-marks';

// Plan T18.7 (Q80, D622): crisp, Reduce-Motion-static Zughy-32 pixel heraldry overlays for
// visible Courtyard Marks across both the 8 × 12 HoldGrid (256 × 384) and HoldScene (160 × 64).
// Layered cleanly alongside bought shop cosmetics and ready for T18.11 pixel PNG replacement.

type Point = readonly [number, number];

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

const Emblem = ({ id }: { id: CourtyardMarkId }) => {
  switch (id) {
    case 'fjord-bone-standard':
      return (
        <>
          <rect x="3" y="1" width="2" height="18" fill="#141013" />
          <rect x="4" y="2" width="1" height="16" fill="#d6b896" />
          <polygon points="5,3 15,6 5,10" fill="#d84b36" stroke="#141013" stroke-width="1" />
          <rect x="6" y="5" width="4" height="2" fill="#f4cca1" />
        </>
      );
    case 'barrow-brazier':
      return (
        <>
          <rect
            x="3"
            y="10"
            width="10"
            height="7"
            fill="#5a4e44"
            stroke="#141013"
            stroke-width="1"
          />
          <rect x="5" y="11" width="6" height="2" fill="#9e8c7a" />
          <polygon points="5,10 8,3 11,10" fill="#f47e1b" />
          <polygon points="6,10 8,5 10,10" fill="#f4b41b" />
        </>
      );
    case 'river-reed-basin':
      return (
        <>
          <rect
            x="2"
            y="10"
            width="12"
            height="6"
            fill="#7c7062"
            stroke="#141013"
            stroke-width="1"
          />
          <rect x="4" y="9" width="8" height="3" fill="#4f8fba" />
          <rect x="6" y="3" width="1" height="7" fill="#4a9d76" />
          <rect x="9" y="4" width="1" height="6" fill="#4a9d76" />
          <rect x="5" y="2" width="2" height="3" fill="#734c3a" />
        </>
      );
    case 'stoneback-cairn':
      return (
        <>
          <rect
            x="2"
            y="13"
            width="12"
            height="4"
            fill="#6b5e53"
            stroke="#141013"
            stroke-width="1"
          />
          <rect x="4" y="9" width="8" height="4" fill="#8b7d70" stroke="#141013" stroke-width="1" />
          <rect x="6" y="5" width="4" height="4" fill="#b8aa99" stroke="#141013" stroke-width="1" />
          <rect x="7" y="10" width="2" height="2" fill="#dff6f5" />
        </>
      );
    case 'kettle-barrow-wreath':
      return (
        <>
          <circle cx="8" cy="9" r="6" fill="#245b46" stroke="#141013" stroke-width="1" />
          <circle cx="8" cy="9" r="3" fill="#3a2d24" stroke="#141013" stroke-width="1" />
          <rect x="5" y="4" width="2" height="2" fill="#d84b36" />
          <rect x="10" y="6" width="2" height="2" fill="#f4b41b" />
          <rect x="6" y="12" width="2" height="2" fill="#d84b36" />
        </>
      );
    case 'watch-fire-sconce':
      return (
        <>
          <rect
            x="6"
            y="7"
            width="4"
            height="10"
            fill="#3a2d24"
            stroke="#141013"
            stroke-width="1"
          />
          <rect x="4" y="7" width="8" height="3" fill="#5a4e44" stroke="#141013" stroke-width="1" />
          <polygon points="5,7 8,1 11,7" fill="#d84b36" />
          <polygon points="6,7 8,3 10,7" fill="#f4b41b" />
        </>
      );
  }
};

/** Static inline-SVG Courtyard Mark overlay for Grid (256 × 384) and Classic scene (160 × 64). */
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
  const scale = variant === 'grid' ? 1 : 0.9;
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      aria-hidden="true"
      data-courtyard-marks-layer={variant}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        shapeRendering: 'crispEdges',
      }}
    >
      {marks.map((id) => {
        const [x, y] = anchors[id];
        return (
          <g key={id} data-courtyard-mark={id} transform={`translate(${x} ${y}) scale(${scale})`}>
            <Emblem id={id} />
          </g>
        );
      })}
    </svg>
  );
};
