import { formatRate } from '../../core/format';
import { ageIndex } from '../../core/systems/ages';
import { threatMeter, threatRate } from '../../core/threat/threat';
import { game, version } from '../app/runtime';
import styles from '../styles/ui.module.css';
import { Num } from './Num';

// GDD §9.13 (D108): the Threat meter on the Hold screen, from the Keep: the value and
// "+X per hour now"; long-press for the breakdown (the Rank's rate, what defenses take
// off, contracts completed and failed).
export const ThreatMeter = () => {
  void version.value;
  const s = game();
  if (ageIndex(s.cycle.age) < ageIndex('keep')) return null;
  if (s.arrivalDue) {
    return (
      <p class={`${styles.small} ${styles.dim}`}>Threat counts after your first Long Night.</p>
    );
  }
  const rate = threatRate(s);
  return (
    <p class={styles.small}>
      Threat <Num text={formatRate(s.threat)} breakdown={() => threatMeter(s).breakdown} marked />{' '}
      <span class={styles.dim}>
        · +<Num text={formatRate(rate.value)} breakdown={() => rate.breakdown} /> per hour now
      </span>
    </p>
  );
};
