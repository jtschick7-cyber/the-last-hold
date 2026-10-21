import { orderSceneId } from '../../content/assets';
import { sceneOf } from '../../content/story/orders-scenes-all';
import type { OrderId } from '../../content/orders';
import { seatCount } from '../../core/systems/orders-seats';
import { dispatch, game } from '../app/runtime';
import { closeSheet, openSheet } from '../app/sheets';
import { Sprite } from '../widgets/Sprite';
import styles from '../styles/ui.module.css';

// GDD §9.18 (D422): an Order's opening scene ends with "Seat it" (while a seat is free) and "Not now",
// or with "Continue" when every seat is taken. Nothing seats itself. Texts are lore §33, word for word.

const sceneIdOf: Record<OrderId, string> = {
  moot: 'OS-M',
  greyWives: 'OS-G',
  bellWatchers: 'OS-B',
  quenchers: 'OS-Q',
};

const OpeningView = ({ id }: { id: OrderId }) => {
  const s = game();
  const scene = sceneOf(sceneIdOf[id]);
  if (!scene) return <p>Nothing here.</p>;
  const free = s.orders.seats.length < seatCount(s);
  const finish = (seatIt: boolean): void => {
    dispatch({ type: 'orders.finishOpening', order: id, seatIt });
    closeSheet();
  };
  return (
    <div>
      <Sprite id={orderSceneId(id)} fill />
      {scene.body.map((p) => (
        <p key={p}>{p}</p>
      ))}
      <div class={styles.row}>
        {free ? (
          <>
            <button type="button" class={styles.btn} onClick={() => finish(false)}>
              Not now
            </button>
            <button type="button" class={styles.btnPrimary} onClick={() => finish(true)}>
              Seat it
            </button>
          </>
        ) : (
          <button type="button" class={styles.btnPrimary} onClick={() => finish(false)}>
            Continue
          </button>
        )}
      </div>
    </div>
  );
};

/** Opens an Order's opening scene as a sheet. */
export const openOpeningScene = (id: OrderId): void => {
  const scene = sceneOf(sceneIdOf[id]);
  if (scene) openSheet(scene.title, () => <OpeningView id={id} />);
};
