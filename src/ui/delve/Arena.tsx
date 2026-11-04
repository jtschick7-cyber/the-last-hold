import type { SpriteFrameName } from '../../content/assets';
import type { CalloutTone, FloorCombatant, PlaybackCallout } from '../../core/delves/view';
import { reducedMotion } from '../app/motion';
import { BattleSprite, type SpriteGlow } from '../widgets/BattleSprite';
import css from './Delve.module.css';

// GDD §9.15 Floor (v1.7, D607): the party on the left, the group on the right, each a battle sprite
// with a Health bar and optional step callout / recoil / rim-glow read directly from the combat log.
const LOW = 0.35;

const TONE_CLASS: Readonly<Record<CalloutTone, string>> = {
  hit: css.calloutHit ?? '',
  crit: css.calloutCrit ?? '',
  heal: css.calloutHeal ?? '',
  miss: css.calloutMiss ?? '',
};

const Unit = ({
  c,
  share,
  frame,
  callout,
  recoil,
  glow,
  stepKey,
}: {
  c: FloorCombatant;
  share: number;
  frame: SpriteFrameName | 'idling';
  callout: PlaybackCallout | null;
  recoil: boolean;
  glow: SpriteGlow | null;
  stepKey: number;
}) => {
  const percent = Math.round(share * 100);
  const still = reducedMotion();
  const floatCls = still ? '' : Math.abs(stepKey) % 2 === 1 ? css.calloutFloatB : css.calloutFloatA;
  return (
    <div class={css.unitWrap} data-unit={c.id}>
      {callout && (
        <span
          class={`${css.callout} ${TONE_CLASS[callout.tone]} ${floatCls}`}
          data-testid="arena-callout"
          data-tone={callout.tone}
        >
          {callout.text}
        </span>
      )}
      <div class={`${css.unit} ${share <= 0 ? css.down : ''}`}>
        <BattleSprite
          id={c.spriteId}
          portraitId={c.portraitId}
          frame={frame}
          label={c.name}
          recoil={recoil}
          glow={glow}
          stepKey={stepKey}
        />
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
    </div>
  );
};

export const Arena = ({
  combatants,
  bars,
  frames,
  callout = null,
  recoils,
  glows,
  stepKey = 0,
}: {
  combatants: readonly FloorCombatant[];
  bars: Readonly<Record<string, number>>;
  frames: Readonly<Record<string, SpriteFrameName>>;
  callout?: PlaybackCallout | null;
  recoils?: Readonly<Record<string, boolean>>;
  glows?: Readonly<Record<string, SpriteGlow>>;
  stepKey?: number;
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
              callout={callout?.target === c.id ? callout : null}
              recoil={recoils?.[c.id] === true}
              glow={glows?.[c.id] ?? null}
              stepKey={stepKey}
            />
          ))}
      </div>
    ))}
  </div>
);
