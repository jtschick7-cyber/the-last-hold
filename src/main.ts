import { h, render } from 'preact';
import { buildInfo } from './platform/build-info';
import { browserBackend, createChannelStorage } from './platform/storage';
import { registerServiceWorker } from './platform/service-worker';
import { App, pendingUpdate } from './ui/app/App';
import './ui/styles/tokens.css';

// v0.0 has no game state yet. The open counter is the visible proof that live and
// preview keep separate storage (plan v0.0 acceptance 3).
const countOpen = (): number | null => {
  const backend = browserBackend();
  if (!backend) return null;
  const store = createChannelStorage(buildInfo.channel, backend);
  const next = Number(store.get('opens') ?? '0') + 1;
  store.set('opens', String(next));
  return next;
};

const root = document.getElementById('app');
if (root) render(h(App, { opens: countOpen() }), root);

registerServiceWorker((update) => {
  pendingUpdate.value = update;
});
