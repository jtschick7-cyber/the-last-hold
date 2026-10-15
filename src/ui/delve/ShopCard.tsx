import { delvesOpen } from '../../core/delves/access';
import { shopView, type ShopRow } from '../../core/delves/view-shop';
import { dispatch, game, version } from '../app/runtime';
import styles from '../styles/ui.module.css';
import { Num } from '../widgets/Num';
import { Sprite } from '../widgets/Sprite';
import { RIFTGLASS_ICON, delveRelicIconId } from '../../content/assets';

// GDD §5.10.8, §9.15: the Riftglass shop on the Rank screen, beside The Hearth. A button is
// disabled with the very reason the command would refuse with (core/delves/shop.ts).
const Row = ({ row }: { row: ShopRow }) => (
  <li class={`${styles.row} ${styles.divider}`}>
    <span class={styles.grow}>
      <strong>{row.name}</strong> {row.status && <span class={styles.dim}>{row.status}</span>}
      <br />
      <span class={`${styles.small} ${styles.dim}`}>{row.text}</span>
      {row.problem && !row.owned && (
        <>
          <br />
          <span class={`${styles.small} ${styles.warn}`}>{row.problem}</span>
        </>
      )}
    </span>
    {row.cost !== null && row.command ? (
      <button
        type="button"
        class={row.problem ? styles.btn : styles.btnPrimary}
        disabled={row.problem !== null}
        onClick={() => row.command && dispatch(row.command)}
      >
        {row.cost}
      </button>
    ) : (
      <span class={styles.dim}>{row.owned ? '✔' : 'Max'}</span>
    )}
  </li>
);

export const RiftglassShop = () => {
  void version.value;
  const s = game();
  if (!delvesOpen(s)) return null;
  const v = shopView(s);
  return (
    <div class={styles.card} style={{ marginTop: 'var(--space-3)' }}>
      <h3 class={styles.cardTitle}>The Riftglass shop</h3>
      <p class={styles.small}>
        <Sprite id={RIFTGLASS_ICON} /> <strong>{v.held} Riftglass</strong>{' '}
        <span class={styles.dim}>
          — <Num text={`${v.allowance.value} waiting`} breakdown={() => v.allowance.breakdown} />
        </span>
      </p>
      <ul class={styles.list}>
        <Row row={v.late} />
        {v.delveOnly.map((r) => (
          <Row key={r.id} row={r} />
        ))}
      </ul>
      <h4 class={`${styles.small} ${styles.dim}`}>The hold</h4>
      <ul class={styles.list}>
        {v.cosmetics.map((r) => (
          <Row key={r.id} row={r} />
        ))}
      </ul>
      <h4 class={`${styles.small} ${styles.dim}`}>Another second trait, for a hunter</h4>
      <ul class={styles.list}>
        {v.traits.map((t) => (
          <li key={t.hunter} class={`${styles.row} ${styles.divider}`}>
            <span class={styles.grow}>
              <strong>{t.hunterName}</strong>: {t.altName}
              <br />
              <span class={`${styles.small} ${styles.dim}`}>{t.altText}</span>
              {t.problem && !t.bought && (
                <>
                  <br />
                  <span class={`${styles.small} ${styles.warn}`}>{t.problem}</span>
                </>
              )}
            </span>
            {t.bought ? (
              <span class={styles.dim}>✔</span>
            ) : (
              <button
                type="button"
                class={t.problem ? styles.btn : styles.btnPrimary}
                disabled={t.problem !== null}
                onClick={() => dispatch({ type: 'riftglass.buyTrait', hunter: t.hunter })}
              >
                {t.cost}
              </button>
            )}
          </li>
        ))}
      </ul>
      {v.relics.length > 0 && (
        <>
          <h4 class={`${styles.small} ${styles.dim}`}>Found in the Delves</h4>
          <ul class={styles.list}>
            {v.relics.map((r) => (
              <li key={r.name} class={`${styles.row} ${styles.divider}`}>
                <Sprite id={delveRelicIconId(r.id)} />
                <span class={styles.grow}>
                  <strong>{r.name}</strong>: {r.text}
                  <br />
                  <span class={`${styles.small} ${styles.dim}`}>{r.line}</span>
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
};
