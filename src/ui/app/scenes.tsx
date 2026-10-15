import { useState } from 'preact/hooks';
import { hunters } from '../../content/hunters';
import { scenes, storyScenes, type SceneId } from '../../content/text/scenes';
import { riftScene } from '../../content/delves/rift-text';
import { delvesOpen } from '../../core/delves/access';
import { isFound } from '../../core/story/documents';
import styles from '../styles/ui.module.css';
import { WardenNameField } from '../widgets/WardenNameField';
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

const sceneOf = (id: SceneId): { title: string; paragraphs: readonly string[] } =>
  id in scenes
    ? scenes[id as keyof typeof scenes]
    : {
        title: storyScenes[id as keyof typeof storyScenes].heading,
        paragraphs: storyScenes[id as keyof typeof storyScenes].paragraphs,
      };

const SceneView = ({ id }: { id: SceneId }) => {
  const { a, b } = lead();
  return (
    <div>
      {sceneOf(id).paragraphs.map((p) => (
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

// GDD §5.14.5: a new game names its first warden before anything else.
const OpeningView = () => {
  const [name, setName] = useState('');
  return (
    <div>
      <WardenNameField label="Your name, warden" value={name} onChange={setName} />
      <button
        type="button"
        class={styles.btnPrimary}
        style={{ width: '100%' }}
        onClick={() => {
          dispatch({ type: 'warden.name', cycle: game().cycle.number, name });
          closeSheet();
        }}
      >
        Begin
      </button>
    </div>
  );
};

// lore-secrets §29 (D266): the way down, shown once when a warden first reaches the Keep.
const RiftSceneView = () => (
  <div>
    {riftScene.map((p) => (
      <p key={p}>{p}</p>
    ))}
    <button
      type="button"
      class={styles.btnPrimary}
      style={{ width: '100%' }}
      onClick={() => {
        dispatch({ type: 'delve.seeScene' });
        closeSheet();
      }}
    >
      Onward
    </button>
  </div>
);

const showRift = (): void => openSheet('The way down', () => <RiftSceneView />);

const show = (id: SceneId): void => {
  dispatch({ type: 'scene.seen', scene: id });
  openSheet(sceneOf(id).title, () => (id === 'opening' ? <OpeningView /> : <SceneView id={id} />));
};

/** A new game: no Ilse yet, no contract sent, still the first cycle (an old save names its wardens on arrival). */
const isNewGame = (): boolean => {
  const s = game();
  return (
    s.story.ilseAt === null &&
    !s.story.arrivalDue &&
    s.cycle.number === 1 &&
    s.running.length === 0 &&
    s.stats.contractsWon + s.stats.contractsLost === 0
  );
};

/** Plays whichever scene is due. Waits while another sheet is open, so nothing stacks. */
export const playScenes = (): void => {
  const s = game();
  if (sheets.value.length > 0) return;
  if (isNewGame() && !s.scenes.includes('opening')) return show('opening');
  const sent = s.running.length > 0 || s.stats.contractsWon + s.stats.contractsLost > 0;
  if (sent && !s.scenes.includes('first-contract')) return show('first-contract');
  // GDD §5.14.3: Ilse walks up with the first document. (An old save meets her in the
  // arrival view instead, which marks this seen.)
  if (s.story.ilseAt !== null && !s.story.arrivalDue && !s.scenes.includes('ilse')) {
    return show('ilse');
  }
  // D2-08 is a scene-type document; Sigrun's vow line follows it (lore-secrets §22).
  if (isFound(s, 'D2-08') && !s.scenes.includes('sigrun-door')) return show('sigrun-door');
  if (s.scenes.includes('sigrun-door') && !s.scenes.includes('sigrun-vow')) {
    return show('sigrun-vow');
  }
  // The first time the hold reaches Keep with hunters on the roster (§6.6).
  if (s.cycle.age === 'keep' && Object.keys(s.hunters).length >= 2 && !s.scenes.includes('vow')) {
    return show('vow');
  }
  if (delvesOpen(s) && !s.delve.sceneSeen) showRift();
};
