import { hunters } from '../../content/hunters';
import { scenes, type SceneId } from '../../content/text/scenes';
import styles from '../styles/ui.module.css';
import { dispatch, game } from './runtime';
import { closeSheet, openSheet, sheets } from './sheets';

// setting-primer §6.6: the first contract and the vow each show once, as a sheet.
// The game only decides *when* (a count or a Rank crossed); the text is content.

const lead = (): { a: string; b: string } => {
  const s = game();
  const owned = (id: keyof typeof hunters): boolean => s.hunters[id] !== undefined;
  // Halvar and Old Ostap lead the vow; if Ostap hasn't arrived, Zora stands in.
  return {
    a: hunters.halvar.shortName,
    b: owned('ostap') ? hunters.ostap.shortName : hunters.zora.shortName,
  };
};

const SceneView = ({ id }: { id: SceneId }) => {
  const { a, b } = lead();
  return (
    <div>
      {scenes[id].paragraphs.map((p) => (
        <p key={p}>{p.replaceAll('{a}', a).replaceAll('{b}', b)}</p>
      ))}
      <button
        type="button"
        class={styles.btnPrimary}
        style={{ width: '100%' }}
        onClick={closeSheet}
      >
        Onward
      </button>
    </div>
  );
};

const show = (id: SceneId): void => {
  dispatch({ type: 'scene.seen', scene: id });
  openSheet(scenes[id].title, () => <SceneView id={id} />);
};

/** Plays whichever scene is due. Waits while another sheet is open, so nothing stacks. */
export const playScenes = (): void => {
  const s = game();
  if (sheets.value.length > 0) return;
  const sent = s.running.length > 0 || s.stats.contractsWon + s.stats.contractsLost > 0;
  if (sent && !s.scenes.includes('first-contract')) return show('first-contract');
  // The first time the hold reaches Keep with hunters on the roster (§6.6).
  if (s.cycle.age === 'keep' && Object.keys(s.hunters).length >= 2 && !s.scenes.includes('vow')) {
    show('vow');
  }
};
