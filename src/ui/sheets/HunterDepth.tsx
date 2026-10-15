import { useState } from 'preact/hooks';
import { hunterRanks } from '../../content/ranks';
import type { HunterId } from '../../content/hunters';
import { useSkillOf } from '../../content/use-skills';
import { num } from '../../core/balance-access';
import { formatNumber } from '../../core/format';
import { rankUpView, starView, trophiesOnHand, type ProgressView } from '../../core/systems/ranks';
import { dispatch, game } from '../app/runtime';
import styles from '../styles/ui.module.css';
import { Num } from '../widgets/Num';

// GDD §9.16 (v0.8, D326): the rank badge and stars, the use-skill, and the Rank up and Add a star
// buttons with their costs and breakdowns. The rules and the words for a refusal come from
// core/systems/ranks.ts; this file only draws them.

const BuyButton = ({
  verb,
  view,
  onBuy,
}: {
  verb: string;
  view: ProgressView;
  onBuy: () => void;
}) => (
  <button
    type="button"
    class={view.available ? styles.btnPrimary : styles.btn}
    disabled={!view.available}
    onClick={onBuy}
  >
    {verb}{' '}
    <Num
      text={`${formatNumber(view.trophies.value)} trophies`}
      breakdown={() => view.trophies.breakdown}
    />
    {view.embers && view.embers.value > 0 && (
      <>
        {' + '}
        <Num
          text={`${formatNumber(view.embers.value)} Embers`}
          breakdown={() => view.embers?.breakdown ?? view.trophies.breakdown}
        />
      </>
    )}
  </button>
);

export const RankStars = ({ id }: { id: HunterId }) => {
  const s = game();
  const h = s.hunters[id];
  const [note, setNote] = useState<string | null>(null);
  if (!h) return null;
  const max = num('star.max');
  const rank = rankUpView(s, id);
  const star = starView(s, id);
  const act = (type: 'hunter.rankUp' | 'hunter.addStar'): void => {
    const r = dispatch({ type, hunter: id });
    setNote(r.ok ? null : r.reason);
  };
  return (
    <div>
      <p class={styles.small}>
        <span class={styles.badge}>{hunterRanks[h.rank].name}</span>{' '}
        <span aria-label={`${h.stars} of ${max} stars`}>
          {'★'.repeat(h.stars)}
          {'☆'.repeat(Math.max(0, max - h.stars))}
        </span>{' '}
        <span class={styles.dim}>Trophies on hand: {formatNumber(trophiesOnHand(s))}</span>
      </p>
      <div class={styles.row}>
        {rank && rank.label !== 'Master-Wright' && (
          <div class={styles.grow}>
            <BuyButton
              verb={`Rank up to ${rank.label}:`}
              view={rank}
              onBuy={() => act('hunter.rankUp')}
            />
            {rank.reason && <div class={`${styles.small} ${styles.dim}`}>{rank.reason}</div>}
          </div>
        )}
        {star && h.stars < max && (
          <div class={styles.grow}>
            <BuyButton verb="Add a star:" view={star} onBuy={() => act('hunter.addStar')} />
            {star.reason && <div class={`${styles.small} ${styles.dim}`}>{star.reason}</div>}
          </div>
        )}
      </div>
      {note && <p class={`${styles.small} ${styles.warn}`}>{note}</p>}
    </div>
  );
};

export const UseSkillRow = ({ id }: { id: HunterId }) => {
  const h = game().hunters[id];
  if (!h) return null;
  const skill = useSkillOf(id);
  const locked = h.rank === 'apprentice';
  return (
    <div class={locked ? styles.dim : undefined}>
      <p class={styles.small}>
        <strong>{skill.name}</strong> · {skill.triggerText}
        {locked && ` · unlocks at ${hunterRanks.wright.name}`}
      </p>
      <p class={`${styles.small} ${styles.dim}`}>{skill.text}</p>
    </div>
  );
};
