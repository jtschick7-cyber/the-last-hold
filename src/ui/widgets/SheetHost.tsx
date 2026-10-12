import { useRef } from 'preact/hooks';
import { closeSheet, sheets } from '../app/sheets';
import css from './Sheet.module.css';

// GDD §9.1: bottom sheets that swipe down to close. Only the top sheet shows.
const SWIPE_CLOSE_PX = 80;

export const SheetHost = () => {
  const top = sheets.value[sheets.value.length - 1];
  const startY = useRef<number | null>(null);
  if (!top) return null;
  return (
    <div class={css.backdrop} onClick={closeSheet}>
      <section
        class={css.sheet}
        role="dialog"
        aria-modal="true"
        aria-label={top.title}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          class={css.handleArea}
          onPointerDown={(e) => (startY.current = e.clientY)}
          onPointerUp={(e) => {
            if (startY.current !== null && e.clientY - startY.current > SWIPE_CLOSE_PX)
              closeSheet();
            startY.current = null;
          }}
        >
          <div class={css.handle} />
        </div>
        <header class={css.header}>
          <h2 class={css.title}>{top.title}</h2>
          <button type="button" class={css.close} onClick={closeSheet} aria-label="Close">
            ✕
          </button>
        </header>
        <div class={css.body}>{top.render()}</div>
      </section>
    </div>
  );
};
