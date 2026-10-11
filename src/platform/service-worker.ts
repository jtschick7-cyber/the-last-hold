// Technical design §11.1: the update banner offers a reload; it never reloads on
// its own. Registered by hand (not via workbox-window) to keep runtime
// dependencies at two.
export interface UpdateHandle {
  /** Activate the waiting version, then reload. Callers save first. */
  apply(): void;
}

export const registerServiceWorker = (onUpdateReady: (update: UpdateHandle) => void): void => {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
  const base = import.meta.env.BASE_URL;

  const offer = (worker: ServiceWorker): void => {
    onUpdateReady({
      apply: () => {
        navigator.serviceWorker.addEventListener(
          'controllerchange',
          () => window.location.reload(),
          {
            once: true,
          },
        );
        // Workbox's generated worker skips waiting when it receives this message.
        worker.postMessage({ type: 'SKIP_WAITING' });
      },
    });
  };

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(`${base}sw.js`, { scope: base })
      .then((reg) => {
        // A waiting worker with a live controller means a new version is ready.
        if (reg.waiting && navigator.serviceWorker.controller) offer(reg.waiting);
        reg.addEventListener('updatefound', () => {
          const incoming = reg.installing;
          if (!incoming) return;
          incoming.addEventListener('statechange', () => {
            if (incoming.state === 'installed' && navigator.serviceWorker.controller)
              offer(incoming);
          });
        });
        // Check again whenever the app comes back to the foreground.
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') void reg.update();
        });
      })
      .catch(() => {
        // Offline play just isn't available; the game itself still runs.
      });
  });
};
