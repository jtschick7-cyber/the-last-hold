import { game } from './runtime';

/**
 * Whether motion should be still (GDD §9.1, Settings → Reduce motion): "on" always, "system"
 * when the device asks for it. CSS animations already follow this (tokens.css); this is for the
 * playback that is driven by timers.
 */
export const reducedMotion = (): boolean => {
  const setting = game().settings.reduceMotion;
  if (setting === 'on') return true;
  if (setting === 'off') return false;
  return (
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
  );
};
