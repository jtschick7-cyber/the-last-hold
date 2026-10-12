import { useState } from 'preact/hooks';
import { assetById, type AssetKind } from '../../content/assets';
import css from './Sprite.module.css';

// Technical design §12.1: renders a manifest image at an integer scale with
// nearest-neighbor pixels. A missing ID, a placeholder row, or a file that
// fails to load falls back to a silhouette by kind with the subject's
// initials, so missing art never breaks a screen.
const BASE = `${import.meta.env.BASE_URL}assets/`;

const initials = (label: string): string =>
  label
    .split(/\s+/)
    .filter((w) => /^[A-Z]/.test(w))
    .slice(0, 2)
    .map((w) => w[0])
    .join('');

export interface SpriteProps {
  id: string;
  /** Integer scale only (GDD §9.12). */
  scale?: 1 | 2 | 3 | 4;
  /** Stretch to the container's width instead (scenes), keeping pixels crisp. */
  fill?: boolean;
}

export const Sprite = ({ id, scale = 1, fill = false }: SpriteProps) => {
  const entry = assetById.get(id);
  const [broken, setBroken] = useState(false);
  const [w, h] = entry?.size ?? [32, 32];
  const kind: AssetKind = entry?.kind ?? 'icon';
  const style = fill
    ? { width: '100%', aspectRatio: `${w} / ${h}` }
    : { width: `${w * scale}px`, height: `${h * scale}px` };
  const label = entry?.label ?? id;

  if (entry && entry.source !== 'placeholder' && !broken) {
    return (
      <img
        class={css.pixel}
        src={BASE + entry.file}
        alt={label}
        style={style}
        onError={() => setBroken(true)}
      />
    );
  }
  return (
    <span
      class={css.placeholder}
      role="img"
      aria-label={label}
      style={{ ...style, backgroundImage: `url(${BASE}placeholders/${kind}.png)` }}
    >
      {entry?.glyph ?? (kind === 'scene' ? '' : initials(label))}
    </span>
  );
};
