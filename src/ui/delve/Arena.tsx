import type { SpriteFrameName } from '../../content/assets';
import type { FloorCombatant } from '../../core/delves/view';
import { BattleSprite } from '../widgets/BattleSprite';
import css from './Delve.module.css';

// GDD §9.15 Floor: the party on the left, the group on the right, each a battle sprite with a
// Health bar. The caller says which frame each one shows and how full each bar is.
const LOW = 0.35;

const Unit = ({
  c,
  share,
  frame,
}: {
  c: FloorCombatant;
  share: number;
  frame: SpriteFrameName | 'idling';
}) => {
  const percent = Math.round(share * 100);
  return (
    <div class={`${css.unit} ${share <= 0 ? css.down : ''}`}>
      <BattleSprite id={c.spriteId} portraitId={c.portraitId} frame={frame} label={c.name} />
      <div class={css.name}>{c.name}</div>
      <div
        class={css.bar}
        role="progressbar"
        aria-label={`${c.name} Health`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
      >
        <div
          class={`${css.fill} ${share <= LOW ? css.fillLow : ''}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
};

export const Arena = ({
  combatants,
  bars,
  frames,
}: {
  combatants: readonly FloorCombatant[];
  bars: Readonly<Record<string, number>>;
  frames: Readonly<Record<string, SpriteFrameName>>;
}) => (
  <div class={css.arena}>
    {(['hunter', 'monster'] as const).map((side) => (
      <div class={css.side} key={side}>
        {combatants
          .filter((c) => c.side === side)
          .map((c) => (
            <Unit
              key={c.id}
              c={c}
              share={bars[c.id] ?? c.start}
              frame={(bars[c.id] ?? c.start) <= 0 ? 'downed' : (frames[c.id] ?? 'idling')}
            />
          ))}
      </div>
    ))}
  </div>
);
