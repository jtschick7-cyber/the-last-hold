// Technical design §6.3: autosave every 30 s, and immediately when the page is
// hidden or closed. (Saving after each successful command is the dispatcher's
// job.) Returns a function that stops it.
const AUTOSAVE_EVERY_MS = 30 * 1000;

export const startAutosave = (save: () => void): (() => void) => {
  const timer = window.setInterval(save, AUTOSAVE_EVERY_MS);
  const onHide = (): void => {
    if (document.visibilityState === 'hidden') save();
  };
  document.addEventListener('visibilitychange', onHide);
  window.addEventListener('pagehide', save);
  return () => {
    window.clearInterval(timer);
    document.removeEventListener('visibilitychange', onHide);
    window.removeEventListener('pagehide', save);
  };
};
