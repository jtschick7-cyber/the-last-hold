import { h, render } from 'preact';
import { registerServiceWorker } from './platform/service-worker';
import { App, pendingUpdate } from './ui/app/App';
import { startGame } from './ui/app/runtime';
import './ui/styles/tokens.css';

const root = document.getElementById('app');
if (root) render(h(App, {}), root);
void startGame();

registerServiceWorker((update) => {
  pendingUpdate.value = update;
});
