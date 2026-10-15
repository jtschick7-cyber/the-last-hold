import { RIFTGLASS_ICON } from '../../content/assets';
import type { BlessingCard, PatronCard } from '../../core/delves/view-run';
import styles from '../styles/ui.module.css';
import { Sprite } from '../widgets/Sprite';
import css from './Delve.module.css';

// GDD §9.15: a patron's door and a blessing's card. A card is a button that selects; the sheet
// holds the choice until it is confirmed, so a stray tap never takes a blessing for the whole run.

/** A 20 px rarity frame with the patron's 16 px sigil inside it, at 3×. */
export const FramedSigil = ({ frameId, sigilId }: { frameId: string; sigilId: string }) => (
  <span class={css.iconBox}>
    <Sprite id={frameId} scale={3} />
    <Sprite id={sigilId} scale={3} />
  </span>
);

export const DoorButton = ({
  door,
  sub,
  onPick,
  picked,
}: {
  door: PatronCard;
  sub?: string;
  onPick: () => void;
  picked?: boolean;
}) => (
  <button
    type="button"
    class={`${css.choice} ${picked ? css.choiceOn : ''}`}
    aria-pressed={picked}
    onClick={onPick}
  >
    <Sprite id={door.sigilId} scale={3} />
    <span class={styles.grow}>
      <strong>{door.name}</strong>
      <br />
      <span class={`${styles.small} ${styles.dim}`}>{door.theme}</span>
      {sub && (
        <>
          <br />
          <span class={styles.small}>{sub}</span>
        </>
      )}
    </span>
  </button>
);

export const BlessingButton = ({
  card,
  sigilId,
  picked,
  onPick,
}: {
  card: BlessingCard;
  sigilId: string;
  picked: boolean;
  onPick: () => void;
}) => (
  <button
    type="button"
    class={`${css.choice} ${picked ? css.choiceOn : ''}`}
    aria-pressed={picked}
    onClick={onPick}
  >
    <FramedSigil frameId={card.frameId} sigilId={sigilId} />
    <span class={styles.grow}>
      <strong>{card.name}</strong> <span class={css.rarity}>{card.rarityName}</span>
      <br />
      <span class={styles.small}>{card.text}</span>
      {card.but && (
        <>
          <br />
          <span class={css.but}>but {card.but}</span>
        </>
      )}
    </span>
  </button>
);

export const RiftglassMark = () => <Sprite id={RIFTGLASS_ICON} />;
