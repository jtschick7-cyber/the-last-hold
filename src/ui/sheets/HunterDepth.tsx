import { useState } from 'preact/hooks';
import { rankBadgeId, STAR_ICON } from '../../content/assets';
import { hunterRanks } from '../../content/ranks';
import type { HunterId } from '../../content/hunters';
import { useSkillOf } from '../../content/use-skills';
import { num } from '../../core/balance-access';
import { formatNumber } from '../../core/format';
import {
  nextRank,
  rankUpView,
  starView,
  trophiesOnHand,
  type ProgressView,
} from '../../core/systems/ranks';
import { dispatch, game, version } from '../app/runtime';
import styles from '../styles/ui.module.css';
import { Num } from '../widgets/Num';
import { Sprite } from '../widgets/Sprite';

// GDD §9.16 (v0.8, D326): the rank badge and stars, the use-skill, and the Rank up and Add a star
// buttons with their costs and breakdowns. The rules and the words for a refusal come from
// core/systems/ranks.ts; this file only draws them.

// The button's own text is plain (a button can't hold another button); the cost beneath it carries
// the breakdown (long-press or ⓘ), built by the same function that built the number.
const BuyButton = ({
  verb,
  view,
  onBuy,
}: {
  verb: string;
  view: ProgressView;
  onBuy: () => void;
}) => (
  <div>
    <button
      type="button"
      class={view.available ? styles.btnPrimary : styles.btn}
      disabled={!view.available}
      onClick={onBuy}
    >
      {verb}
    </button>
    <div class={styles.small}>
      Cost:{' '}
      <Num
        text={`${formatNumber(view.trophies.value)} trophies`}
        breakdown={() => view.trophies.breakdown}
        marked
      />
      {view.embers && view.embers.value > 0 && (
        <>
          {' + '}
          <Num
            text={`${formatNumber(view.embers.value)} Embers`}
            breakdown={() => view.embers?.breakdown ?? view.trophies.breakdown}
            marked
          />
        </>
      )}
    </div>
  </div>
);

export const RankStars = ({ id }: { id: HunterId }) => {
  void version.value; // a child sheet part re-renders only by its own signal
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
        <span class={styles.badge}>
          <Sprite id={rankBadgeId(h.rank)} /> {hunterRanks[h.rank].name}
        </span>{' '}
        <span aria-label={`${h.stars} of ${max} stars`}>
          {Array.from({ length: h.stars }, (_, i) => (
            <Sprite key={i} id={STAR_ICON} />
          ))}
          <span class={styles.dim}>{'☆'.repeat(Math.max(0, max - h.stars))}</span>
        </span>{' '}
        <span class={styles.dim}>Trophies on hand: {formatNumber(trophiesOnHand(s))}</span>
      </p>
      <div class={styles.row}>
        {rank && nextRank(h.rank) !== null && (
          <div class={styles.grow}>
            <BuyButton
              verb={`Rank up to ${rank.label}`}
              view={rank}
              onBuy={() => act('hunter.rankUp')}
            />
            {rank.reason && <div class={`${styles.small} ${styles.dim}`}>{rank.reason}</div>}
          </div>
        )}
        {star && h.stars < max && (
          <div class={styles.grow}>
            <BuyButton verb="Add a star" view={star} onBuy={() => act('hunter.addStar')} />
            {star.reason && <div class={`${styles.small} ${styles.dim}`}>{star.reason}</div>}
          </div>
        )}
      </div>
      {note && <p class={`${styles.small} ${styles.warn}`}>{note}</p>}
    </div>
  );
};

export const UseSkillRow = ({ id }: { id: HunterId }) => {
  void version.value; // a child sheet part re-renders only by its own signal
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
