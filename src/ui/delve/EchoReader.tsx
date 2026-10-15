import styles from '../styles/ui.module.css';
import css from './Delve.module.css';

// lore-secrets §29 (D263): an Ember-echo, word for word, on the parchment card the documents use.
export const EchoReader = ({
  echo,
}: {
  echo: { patronName: string; rarityName: string; text: string };
}) => (
  <div>
    <article class={styles.parchment}>
      <p class={css.reader}>{echo.text}</p>
    </article>
    <p class={`${styles.small} ${styles.dim}`}>
      An Ember-echo from {echo.patronName} · {echo.rarityName}.
    </p>
  </div>
);
