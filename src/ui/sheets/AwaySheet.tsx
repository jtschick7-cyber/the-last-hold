import { RESOURCE_IDS } from '../../content/resources';
import { lineTriggerRules, residentLines } from '../../content/text/lines';
import { residents } from '../../content/residents';
import { formatDuration, formatNumber } from '../../core/format';
import type { AwaySummary } from '../../core/sim';
import styles from '../styles/ui.module.css';
import { ResourceIcon } from '../widgets/ResourceIcon';

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
