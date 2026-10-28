import { useEffect, useState } from 'preact/hooks';
import { DESCENT_STRINGS, descentStageLine } from '../../content/descent-text';
import { hunters, roleNames, type HunterId } from '../../content/hunters';
import { suggestDescentOrder } from '../../core/systems/descent-order';
import { descentSheetView, descentPreviewLines } from '../../core/systems/descent-view';
import { descentPreviewInputFor, descentProblem } from '../../core/systems/descent-record';
import { num } from '../../core/balance-access';
import { requestDescentPreview, type DescentPreviewAnswer } from '../app/odds-client';
import { dispatch, game, version } from '../app/runtime';
import { closeAllSheets, openSheet } from '../app/sheets';
import styles from '../styles/ui.module.css';
import { useLongPress } from '../widgets/use-long-press';
import { KitPicker, type Kit } from './StandSheet';

// GDD §9.24 (D563, S4): the Descent sheet. Header and stages, What the Hold Learned (summary with a
// breakdown sheet), the marching order (Suggest and tap-to-swap), who is away, preparation, the preview
// and Start. Every line is a GDD §9.24 string and every number comes from the core; the playback and
// the result sheet are TD.7b.

const LearnedSheet = () => {
  const v = descentSheetView(game());
  return (
    <div data-testid="descent-learned">
      <ul class={styles.list}>
        {(v.learned.children ?? []).map((c) => (
          <li key={c.label} class={styles.divider}>
            {c.label}
          </li>
        ))}
      </ul>
      {v.delveRelics.length > 0 && (
        <>
          <h3 class={styles.cardTitle}>{v.relicsHeading}</h3>
          <ul class={styles.list}>
            {v.delveRelics.map((r) => (
              <li key={r.id} class={styles.divider}>
                <strong>{r.name}</strong> <span class={styles.dim}>{r.text}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
};

const openLearned = (): void => openSheet('What the hold learned', () => <LearnedSheet />);

const LearnedLine = ({ text }: { text: string }) => {
  const press = useLongPress(openLearned);
  return (
    <p>
      <span {...press} data-testid="descent-learned-line">
        {text}
      </span>{' '}
      <button
        type="button"
        class={`${styles.num} ${styles.info}`}
        onClick={openLearned}
        aria-label="Show what the hold learned"
      >
        ⓘ
      </button>
    </p>
  );
};

const kitFor = (kit: Kit, order: readonly HunterId[]): Kit => ({
  oils: Object.fromEntries(Object.entries(kit.oils).filter(([h]) => order.includes(h as HunterId))),
  potions: Object.fromEntries(
    Object.entries(kit.potions).filter(([h]) => order.includes(h as HunterId)),
  ),
});

export const DescentView = () => {
  void version.value;
  const s = game();
  const view = descentSheetView(s);
  const [order, setOrder] = useState<HunterId[]>(() => suggestDescentOrder(s));
  const [kit, setKit] = useState<Kit>({ oils: {}, potions: {} });
  const [picked, setPicked] = useState<number | null>(null);
  const [answer, setAnswer] = useState<DescentPreviewAnswer | null>(null);
  const [refused, setRefused] = useState<string | null>(null);
  const front = num('laststand.partyMax');
  const chosenKit = kitFor(kit, order);
  const problem = descentProblem(s, order, chosenKit);
  const key = `${order.join(',')}|${JSON.stringify(chosenKit)}`;
  useEffect(() => {
    if (order.length === 0 || problem) return;
    let live = true;
    setAnswer(null);
    void requestDescentPreview(descentPreviewInputFor(s, order, chosenKit)).then((a) => {
      if (live && a) setAnswer(a);
    });
    return () => {
      live = false;
    };
  }, [key]);

  const tapSlot = (i: number): void => {
    if (picked === null) return setPicked(i);
    if (picked !== i) {
      const next = [...order];
      const a = next[picked] as HunterId;
      next[picked] = next[i] as HunterId;
      next[i] = a;
      setOrder(next);
    }
    setPicked(null);
  };
  const kitStocked = Object.values(s.stores).some((n) => n > 0);

  const slot = (id: HunterId, i: number) => {
    const h = s.hunters[id];
    return (
      <li key={id} class={styles.divider}>
        <button
          type="button"
          class={styles.btn}
          style={{ width: '100%', textAlign: 'left' }}
          aria-pressed={picked === i}
          data-testid={`descent-slot-${i}`}
          onClick={() => tapSlot(i)}
        >
          <strong>{hunters[id].shortName}</strong>{' '}
          <span class={styles.dim}>
            {roleNames[hunters[id].role]} · Lv {h?.level ?? 0}
          </span>
        </button>
        {kitStocked && (
          <div class={styles.row} style={{ flexWrap: 'wrap' }}>
            <KitPicker s={s} hunter={id} kind="oil" kit={chosenKit} onChange={setKit} />
            <KitPicker s={s} hunter={id} kind="potion" kit={chosenKit} onChange={setKit} />
          </div>
        )}
      </li>
    );
  };

  const lines = answer ? descentPreviewLines(answer.preview) : null;
  return (
    <div data-testid="descent-sheet">
      <p class={styles.dim}>{DESCENT_STRINGS.subtitle}</p>
      <ul class={styles.list}>
        {([1, 2, 3] as const).map((n) => (
          <li key={n} class={styles.divider} data-testid={`descent-stage-${n}`}>
            {descentStageLine(n)}
          </li>
        ))}
      </ul>
      <LearnedLine text={view.learnedLine} />
      <div class={styles.row} style={{ flexWrap: 'wrap' }}>
        <button
          type="button"
          class={styles.btn}
          data-testid="descent-suggest"
          onClick={() => {
            setOrder(suggestDescentOrder(game()));
            setPicked(null);
          }}
        >
          Suggest
        </button>
      </div>
      <h3 class={styles.cardTitle}>{DESCENT_STRINGS.rows.front}</h3>
      <ul class={styles.list}>{order.slice(0, front).map((id, i) => slot(id, i))}</ul>
      {order.length > front && (
        <>
          <h3 class={styles.cardTitle}>{DESCENT_STRINGS.rows.reserve}</h3>
          <ul class={styles.list}>{order.slice(front).map((id, i) => slot(id, i + front))}</ul>
        </>
      )}
      {view.unavailable.length > 0 && (
        <>
          <h3 class={styles.cardTitle}>{DESCENT_STRINGS.unavailable}</h3>
          <ul class={styles.list} data-testid="descent-unavailable">
            {view.unavailable.map((u) => (
              <li key={u.id} class={styles.divider}>
                <strong>{hunters[u.id].shortName}</strong>{' '}
                <span class={styles.dim}>{u.reason}</span>
              </li>
            ))}
          </ul>
        </>
      )}
      <p class={`${styles.small} ${styles.dim}`}>{DESCENT_STRINGS.bombs}</p>
      <div class={styles.small} data-testid="descent-preview">
        {!lines ? (
          <p class={styles.dim}>{problem ?? '…'}</p>
        ) : (
          <>
            <p>{lines.win}</p>
            <p>{lines.expected}</p>
            <p class={styles.dim}>
              {lines.why}
              {answer?.quick ? ' (quick estimate)' : ''}
            </p>
          </>
        )}
      </div>
      {refused && <p role="alert">{refused}</p>}
      <button
        type="button"
        class={styles.btnPrimary}
        style={{ width: '100%' }}
        disabled={problem !== null}
        data-testid="descent-start"
        onClick={() => {
          const r = dispatch({ type: 'descent.start', order, prep: chosenKit });
          if (r.ok) closeAllSheets();
          else setRefused(r.reason);
        }}
      >
        {DESCENT_STRINGS.start}
      </button>
    </div>
  );
};

export const openDescentSheet = (): void =>
  openSheet(DESCENT_STRINGS.button, () => <DescentView />);
