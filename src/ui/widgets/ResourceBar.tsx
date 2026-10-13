import { RESOURCE_IDS, resources } from '../../content/resources';
import { formatExact, formatNumber } from '../../core/format';
import { idlePeasants } from '../../core/systems/housing';
import { game, version } from '../app/runtime';
import { openSheet } from '../app/sheets';
import { RatesSheet } from '../sheets/RatesSheet';
import css from './ResourceBar.module.css';
import { ResourceIcon } from './ResourceIcon';

// GDD §9.1: always visible; tapping it opens the rates sheet. ⚠️ for idle hands.
export const ResourceBar = () => {
  void version.value;
  const s = game();
  const idle = idlePeasants(s);
  return (
    <button type="button" class={css.bar} onClick={() => openSheet('Rates', () => <RatesSheet />)}>
      {RESOURCE_IDS.map((r) => (
        <span
          key={r}
          class={css.item}
          title={`${resources[r].name}: ${formatExact(s.resources[r])}`}
        >
          <ResourceIcon r={r} />
          <span class={css.amount}>{formatNumber(s.resources[r])}</span>
          <span class="sr-only">{resources[r].name}</span>
        </span>
      ))}
      {idle > 0 && (
        <span class={css.alert} title={`${idle} idle`} aria-label={`${idle} idle peasants`}>
          ⚠️
        </span>
      )}
    </button>
  );
};
