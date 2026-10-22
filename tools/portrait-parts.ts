// Shared bits of the 64 px portrait drawings (draw-monster.ts, draw-monster-redraws.ts).
import { C, type Canvas } from './pixel';

export const CX = 32;

/** Two matching eyes, mirrored about the middle. */
export const eyes = (
  c: Canvas,
  y: number,
  dx: number,
  w: number,
  h: number,
  color: string,
  pupil?: string,
): void => {
  c.mirrored((set) => {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) set(CX - dx - i, y + j, color);
    if (pupil) set(CX - dx - Math.floor(w / 2), y + Math.floor(h / 2), pupil);
  });
};

export const fangs = (c: Canvas, y: number, dx: number, len: number, color = C.frost): void => {
  c.mirrored((set) => {
    for (let j = 0; j < len; j++) set(CX - dx, y + j, color);
  });
};
