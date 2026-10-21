import { consumables, type ConsumableId } from '../../content/consumables';
import { RESOURCE_IDS } from '../../content/resources';
import { lineTriggerRules, residentLines } from '../../content/text/lines';
import { residents } from '../../content/residents';
import { hunters, type HunterId } from '../../content/hunters';
import { experimentLines } from '../../core/alchemy/hut-view';
import { formatDuration, formatNumber } from '../../core/format';
import type { AwaySummary } from '../../core/sim';
import styles from '../styles/ui.module.css';
import { levelUpLines } from '../app/lines';
import { ResourceIcon } from '../widgets/ResourceIcon';
import { ResultsView } from './ResultsSheet';
import { ReadyLine } from '../remembering/ReadyLine';

const MS = 1000;

// GDD §9.3 / §5.2: time counted, time past the cap, resources, peasants settled.
export const AwayView = ({ summary, onDone }: { summary: AwaySummary; onDone?: () => void }) => {
  const long = summary.away / MS >= lineTriggerRules.longAbsenceSeconds;
  const pechko = residentLines['long-absence'];
  const line = pechko.variants[Math.floor(summary.away / MS) % pechko.variants.length];
  return (
    <div>
      <p>
        {formatDuration(summary.away / MS)} away
        {summary.capped && <> · {formatDuration(summary.counted / MS)} counted (cap)</>}
      </p>
      <div class={styles.cost}>
        {RESOURCE_IDS.filter((r) => Math.abs(summary.resources[r]) >= 1).map((r) => (
          <span key={r}>
            {summary.resources[r] >= 0 ? '+' : '−'}
            {formatNumber(Math.abs(summary.resources[r]))} <ResourceIcon r={r} />
          </span>
        ))}
      </div>
      {summary.peasantsSettled > 0 && (
        <p>
          +{summary.peasantsSettled} {summary.peasantsSettled === 1 ? 'peasant' : 'peasants'}{' '}
          settled
        </p>
      )}
      {summary.contracts.length > 0 && <ResultsView results={summary.contracts} />}
      {summary.arrivals > 0 && (
        <p class={styles.small}>
          {summary.arrivals} new {summary.arrivals === 1 ? 'contract' : 'contracts'} on the board
        </p>
      )}
      {summary.events.some((e) => e.type === 'brew') && (
        <p class={styles.small}>
          Brewed:{' '}
          {summary.events
            .filter((e) => e.type === 'brew')
            .map((e) => (e.type === 'brew' ? consumables[e.item as ConsumableId].name : ''))
            .join(', ')}
        </p>
      )}
      {summary.events.some((e) => e.type === 'experiment') && (
        <div class={styles.small}>
          {summary.events.flatMap((e) =>
            e.type === 'experiment'
              ? experimentLines((id) => consumables[id].name, e).map((line, i) => (
                  <p key={`${e.at}:${i}`} class={styles.good}>
                    {line}
                  </p>
                ))
              : [],
          )}
        </div>
      )}
      {summary.skills &&
        levelUpLines(summary.skills.before, summary.skills.after).map((line) => (
          <p key={line} class={`${styles.small} ${styles.good}`}>
            {line}
          </p>
        ))}
      {summary.events.some((e) => e.type === 'clue') && (
        <p class={styles.small}>
          {summary.events.filter((e) => e.type === 'clue').length} clues came in at the Lodge.
        </p>
      )}
      {summary.recovered.length > 0 && (
        <p class={styles.small}>
          Back on their feet:{' '}
          {summary.recovered.map((h) => hunters[h as HunterId].shortName).join(', ')}
        </p>
      )}
      {summary.eventsLine && <p class={styles.small}>{summary.eventsLine}</p>}
      <ReadyLine />
      {(summary.delve ?? []).map((l) => (
        <p key={l} class={styles.small}>
          {l}
        </p>
      ))}
      {long && line && (
        <p class={styles.small}>
          <strong>{residents[pechko.speaker].shortName}:</strong> “{line}”
        </p>
      )}
      {onDone && (
        <button type="button" class={styles.btnPrimary} style={{ width: '100%' }} onClick={onDone}>
          Onward
        </button>
      )}
    </div>
  );
};
