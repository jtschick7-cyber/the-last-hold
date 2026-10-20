import { signal } from '@preact/signals';
import { allDocuments } from '../../content/story/acts';
import {
  accounts,
  laterNote,
  lettersShelf,
  rimeShelf,
  library,
  namesView,
  type ShelfLetter,
} from '../../core/story/archive';
import { docKey } from '../../core/story/documents';
import { letterKey } from '../../core/story/letters';
import { dispatch, game, version } from '../app/runtime';
import { openSheet } from '../app/sheets';
import styles from '../styles/ui.module.css';
import { docIconId } from '../../content/assets';
import { Sprite } from '../widgets/Sprite';
import { riftScene } from '../../content/delves/rift-text';
import { echoesShelf } from '../../core/delves/view-shop';
import { EchoReader } from '../delve/EchoReader';
import { BestiaryScreen } from './BestiaryScreen';

// GDD §5.14.3, §9.14 (D150): once Ilse arrives, the Bestiary tab becomes the
// Archive, with four sections. Opening an item clears its badge.

const SECTIONS = ['Bestiary', 'Library', 'Accounts', 'Names'] as const;
type Section = (typeof SECTIONS)[number];
const section = signal<Section>('Library');

const markRead = (key: string): void => {
  if (game().story.unread.includes(key)) dispatch({ type: 'archive.read', key });
};

const Paragraphs = ({ lines }: { lines: readonly string[] }) => (
  <>
    {lines.map((p, i) => (
      <p key={i} style={{ whiteSpace: 'pre-line' }}>
        {p}
      </p>
    ))}
  </>
);

/** The reader: the text on a parchment-toned card, Ilse's note under it, and where it was found. */
export const DocumentReader = ({ id }: { id: string }) => {
  void version.value;
  const s = game();
  const doc = allDocuments.find((d) => d.id === id);
  if (!doc) return null;
  const row = [...library(s).flatMap((g) => g.types.flatMap((t) => t.rows)), ...rimeShelf(s)].find(
    (r) => r.id === id,
  );
  const later = laterNote(s, id);
  return (
    <div>
      <article class={doc.type === 'rime' ? styles.rime : styles.parchment}>
        {doc.preface && <Paragraphs lines={[doc.preface]} />}
        {doc.table && (
          <table class={styles.ledger}>
            <thead>
              <tr>
                {doc.table.header.map((h, i) => (
                  <th key={i}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {doc.table.rows.map((r, i) => (
                <tr key={i}>
                  {r.map((c, j) => (
                    <td key={j}>{c}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <Paragraphs lines={doc.body} />
        {doc.signature && <p>{doc.signature}</p>}
      </article>
      {doc.ilseNote && (
        <p class={styles.dim}>
          <em>{doc.ilseNote}</em>
        </p>
      )}
      {later && (
        <p class={styles.dim}>
          <em>{later}</em>
        </p>
      )}
      {row && <p class={`${styles.small} ${styles.dim}`}>{row.foundLine}</p>}
    </div>
  );
};

export const LetterReader = ({ letter }: { letter: ShelfLetter }) => (
  <div>
    <article class={styles.parchment}>
      <Paragraphs lines={letter.letter.body ?? []} />
      <p>{letter.letter.signature}</p>
    </article>
    <p class={`${styles.small} ${styles.dim}`}>Written at level {letter.level}.</p>
  </div>
);

export const openDocument = (id: string): void => {
  const doc = allDocuments.find((d) => d.id === id);
  if (!doc) return;
  markRead(docKey(id));
  openSheet(doc.heading, () => <DocumentReader id={id} />);
};

export const openLetter = (l: ShelfLetter): void => {
  markRead(letterKey(l.hunter, l.slot));
  openSheet(`From ${l.from}`, () => <LetterReader letter={l} />);
};

/** A document's type, for its icon. */
const typeOf = (id: string): string | undefined => allDocuments.find((d) => d.id === id)?.type;

const New = () => <span class={styles.badge}>new</span>;

const Library = () => {
  const s = game();
  const groups = library(s);
  const shelf = lettersShelf(s);
  const echoList = echoesShelf(s);
  const rime = rimeShelf(s);
  const wayDown = s.delve.sceneSeen;
  if (groups.length === 0 && shelf.length === 0 && echoList.length === 0 && !wayDown)
    return <p class={styles.dim}>Nothing in the archive yet.</p>;
  return (
    <>
      {groups.map((g) => (
        <section key={g.act} class={styles.card} aria-label={g.act}>
          <h2 class={styles.cardTitle}>{g.act}</h2>
          {g.types.map((t) => (
            <div key={t.type}>
              <h3 class={`${styles.small} ${styles.dim}`}>{t.type}</h3>
              <ul class={styles.list}>
                {t.rows.map((r) => (
                  <li key={r.id}>
                    <button type="button" class={styles.linkRow} onClick={() => openDocument(r.id)}>
                      {docIconId(typeOf(r.id) ?? '') && (
                        <Sprite id={docIconId(typeOf(r.id) ?? '') ?? ''} />
                      )}
                      <span class={styles.grow}>
                        <strong>{r.heading}</strong>
                        <span class={`${styles.small} ${styles.dim}`}> · {r.witness}</span>
                      </span>
                      {r.unread && <New />}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      ))}
      <section class={styles.card} aria-label="Rime">
        <h2 class={styles.cardTitle}>Rime</h2>
        {rime.length === 0 ? (
          <p class={`${styles.small} ${styles.dim}`}>Nothing here yet.</p>
        ) : (
          <ul class={styles.list}>
            {rime.map((r) => (
              <li key={r.id}>
                <button type="button" class={styles.linkRow} onClick={() => openDocument(r.id)}>
                  <span class={styles.grow}>
                    <strong>{r.heading}</strong>
                    <span class={`${styles.small} ${styles.dim}`}> · {r.witness}</span>
                  </span>
                  {r.unread && <New />}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
      {echoList.length > 0 && (
        <section class={styles.card} aria-label="Echoes">
          <h2 class={styles.cardTitle}>Echoes</h2>
          <p class={`${styles.small} ${styles.dim}`}>
            Things the patrons said, once, from below. Found: {echoList.length}.
          </p>
          <ul class={styles.list}>
            {echoList.map((e) => (
              <li key={e.id}>
                <button
                  type="button"
                  class={styles.linkRow}
                  onClick={() => openSheet('An Ember-echo', () => <EchoReader echo={e} />)}
                >
                  <span class={styles.grow}>
                    <strong>{e.patronName}</strong>
                    <span class={`${styles.small} ${styles.dim}`}> · {e.rarityName}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
      {wayDown && (
        <section class={styles.card} aria-label="Scenes">
          <h2 class={styles.cardTitle}>Scenes</h2>
          <button
            type="button"
            class={styles.linkRow}
            onClick={() =>
              openSheet('The way down', () => (
                <div>
                  {riftScene.map((p) => (
                    <p key={p}>{p}</p>
                  ))}
                </div>
              ))
            }
          >
            <span class={styles.grow}>
              <strong>The way down</strong>
              <span class={`${styles.small} ${styles.dim}`}> · Pechko</span>
            </span>
          </button>
        </section>
      )}
      {shelf.length > 0 && (
        <section class={styles.card} aria-label="Letters">
          <h2 class={styles.cardTitle}>Letters</h2>
          <ul class={styles.list}>
            {shelf.map((l) => (
              <li key={`${l.hunter}${l.slot}`}>
                <button type="button" class={styles.linkRow} onClick={() => openLetter(l)}>
                  <span class={styles.grow}>
                    <strong>{l.from}</strong>
                    <span class={`${styles.small} ${styles.dim}`}> · level {l.level}</span>
                  </span>
                  {l.unread && <New />}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
};

const Accounts = () => {
  const cards = accounts(game());
  if (cards.length === 0) return <p class={styles.dim}>No accounts yet.</p>;
  return (
    <>
      {cards.map((c) => (
        <section key={c.heading} class={styles.card} aria-label={c.heading}>
          <h2 class={styles.cardTitle}>{c.heading}</h2>
          {c.accounts.map((a) => (
            <button
              type="button"
              key={a.document}
              class={styles.linkRow}
              onClick={() => openDocument(a.document)}
            >
              <span class={styles.grow}>
                <span class={`${styles.small} ${styles.dim}`}>{a.witness}</span>
                <br />“{a.excerpt}”
              </span>
            </button>
          ))}
        </section>
      ))}
    </>
  );
};

const Names = () => {
  const view = namesView(game());
  return (
    <section class={styles.card} aria-label="Names">
      <h2 class={styles.cardTitle}>{view.title}</h2>
      <ol class={styles.list}>
        {view.rows.map((r) => (
          <li key={r.n} class={r.found ? undefined : styles.dim}>
            {r.text}
            {r.hint && <div class={styles.small}>{r.hint}</div>}
          </li>
        ))}
      </ol>
    </section>
  );
};

export const ArchiveScreen = () => {
  void version.value;
  return (
    <div>
      <div class={styles.segmented} role="group" aria-label="Archive section">
        {SECTIONS.map((x) => (
          <button
            type="button"
            key={x}
            class={section.value === x ? styles.segmentOn : styles.segment}
            aria-pressed={section.value === x}
            onClick={() => (section.value = x)}
          >
            {x}
          </button>
        ))}
      </div>
      {section.value === 'Bestiary' && <BestiaryScreen />}
      {section.value === 'Library' && <Library />}
      {section.value === 'Accounts' && <Accounts />}
      {section.value === 'Names' && <Names />}
    </div>
  );
};
