import { act4ArrivalOnLoad } from '../../content/story/act4';
import { act5ArrivalOnLoad } from '../../content/story/act5';
import { dispatch } from '../app/runtime';
import { openSheet } from '../app/sheets';
import styles from '../styles/ui.module.css';
import { DocumentReader } from '../screens/ArchiveScreen';

// GDD §5.14.1 (D246, D302): a save whose cycle was story-less when Act IV or Act V shipped meets
// the act's opening scene on load. This takes the Hold screen's place until it has been opened;
// More stays open (to export the save first). D4-01 plays as Pechko comes out from behind the
// stove with the oilcloth bundle; D5-01 as he calls you over to the crack.
const ON_LOAD: Readonly<Record<number, { line: string; button: string; sheet: string }>> = {
  4: { line: act4ArrivalOnLoad, button: 'See what he brought', sheet: 'The bundle' },
  5: { line: act5ArrivalOnLoad, button: 'Go and look', sheet: 'The broom' },
};

export const ActArrivalView = ({ act }: { act: number }) => {
  const c = ON_LOAD[act];
  if (!c) return null;
  return (
    <div class={styles.card}>
      <h2 class={styles.cardTitle}>Pechko</h2>
      <p>{c.line}</p>
      <button
        type="button"
        class={styles.btnPrimary}
        style={{ width: '100%' }}
        onClick={() => {
          if (!dispatch({ type: 'story.startAct' }).ok) return;
          openSheet(c.sheet, () => <DocumentReader id={`D${act}-01`} />);
        }}
      >
        {c.button}
      </button>
    </div>
  );
};
