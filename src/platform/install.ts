// Technical design §9.1: a one-time tip to install the game, never shown inside
// the installed app itself.
export const isInstalledApp = (): boolean =>
  window.matchMedia('(display-mode: standalone)').matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;
