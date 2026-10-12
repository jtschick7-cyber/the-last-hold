import { useRef } from 'preact/hooks';

// GDD §9.1: long-press any number to open its breakdown. Returns pointer
// handlers; a press shorter than the threshold counts as a normal tap.
const LONG_PRESS_MS = 450;
const MOVE_TOLERANCE_PX = 10;

export const useLongPress = (onLongPress: () => void) => {
  const timer = useRef<number | null>(null);
  const start = useRef<{ x: number; y: number } | null>(null);
  const cancel = (): void => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = null;
    start.current = null;
  };
  return {
    onPointerDown: (e: PointerEvent) => {
      start.current = { x: e.clientX, y: e.clientY };
      timer.current = window.setTimeout(() => {
        timer.current = null;
        onLongPress();
      }, LONG_PRESS_MS);
    },
    onPointerMove: (e: PointerEvent) => {
      const s = start.current;
      if (s && Math.hypot(e.clientX - s.x, e.clientY - s.y) > MOVE_TOLERANCE_PX) cancel();
    },
    onPointerUp: cancel,
    onPointerLeave: cancel,
    onPointerCancel: cancel,
    onContextMenu: (e: Event) => e.preventDefault(),
  };
};
