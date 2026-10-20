import { monsterPortraitId } from '../../content/assets';
import { DAMAGE_TYPES, families } from '../../content/damage';
import { monsters, type MonsterId } from '../../content/monsters';
import { abilityTips, bestiaryText } from '../../content/text/bestiary';
import { num } from '../../core/balance-access';
import { describeAbility } from '../../core/describe';
import { knowledgeProgress } from '../../core/investigation/view';
import { game, version } from '../app/runtime';
import { openSheet } from '../app/sheets';
import { resistLines } from '../app/contract-text';
import { levelName } from '../app/knowledge-text';
import styles from '../styles/ui.module.css';
import { Sprite } from '../widgets/Sprite';
import { FightLogView } from './FightLogSheet';

// GDD §9.8: one bestiary entry. A silhouette until Identified; then the folklore blurb,
// "What it was", stats, resistances and abilities. Studied and Mastered add their damage
// bonus; Mastered adds a counter-tip for each ability. The last five fights are listed.
export const BestiaryEntryView = ({ monster }: { monster: MonsterId }) => {
  void version.value;
  const s = game();
  const def = monsters[monster];
  const entry = s.bestiary[monster];
  const progress = knowledgeProgress(entry);
  if (progress.level < 2) {
    return (
      <div class={styles.row}>
        <span class={styles.unknownBox}>?</span>
        <p class={styles.dim}>
          Something the contracts have named as a possibility. Fight it, or work out which contract
          it is, and the notebook will fill in.
        </p>
      </div>
    );
  }
  const text = bestiaryText[monster];
  const { weak, resists } = resistLines(monster);
  const fights = s.log.recentFights
    .filter((f) => 'monster' in f.monster && f.monster.monster === monster)
    .slice(-5)
    .reverse();
  return (
    <div>
      <div class={styles.row}>
        <Sprite id={monsterPortraitId(monster)} />
        <div class={styles.grow}>
          <strong>{def.name}</strong>
          <div class={`${styles.small} ${styles.dim}`}>
            {families[def.family].name} · {levelName(progress.level)}
          </div>
        </div>
      </div>
      <p class={styles.small}>
        {progress.kills} {progress.kills === 1 ? 'kill' : 'kills'}
        {progress.nextLevel
          ? ` · ${levelName(progress.nextLevel)} at ${progress.nextAtKills}`
          : ' · nothing left to learn'}
      </p>
      <div
        class={styles.meter}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={num('knowledge.masteredKills')}
        aria-valuenow={Math.min(progress.kills, num('knowledge.masteredKills'))}
      >
        <div
          class={styles.meterFill}
          style={{
            width: `${Math.min(100, (progress.kills / num('knowledge.masteredKills')) * 100)}%`,
          }}
        />
      </div>
      <p>{text.blurb}</p>
      <p class={styles.dim}>
        <em>{text.whatItWas}</em>
      </p>
      <div class={styles.small}>
        Base tier {def.tiers[0]} · Health {def.health} · Might {def.might} · Armor {def.armor} ·
        Speed {def.speed}
        <br />
        weak: {weak}
        <br />
        resists: {resists}
        <br />
        {DAMAGE_TYPES.map((t) => `${t[0]?.toUpperCase()}${t.slice(1)} ×${def.resist[t]}`).join(
          ' · ',
        )}
      </div>
      <h3 class={styles.cardTitle}>Abilities</h3>
      <ul class={styles.list}>
        {def.abilities.map((a) => (
          <li key={a.kind} class={styles.divider}>
            <strong>{a.name}</strong>
            <div class={styles.small}>{describeAbility(a)}</div>
            {progress.level >= 4 && (
              <div class={`${styles.small} ${styles.good}`}>Counter: {abilityTips[a.kind]}</div>
            )}
          </li>
        ))}
      </ul>
      {progress.level >= 3 && (
        <p class={styles.small}>
          +
          {Math.round(
            num(progress.level >= 4 ? 'knowledge.masteredDamage' : 'knowledge.studiedDamage') * 100,
          )}
          % damage against it ({levelName(progress.level)}).
          {progress.level >= 4
            ? ' Its contracts arrive already identified.'
            : ' Clues on its contracts take half the time.'}
        </p>
      )}
      <h3 class={styles.cardTitle}>Encounters</h3>
      {fights.length === 0 ? (
        <p class={`${styles.small} ${styles.dim}`}>No fights on record.</p>
      ) : (
        <ul class={styles.list}>
          {fights.map((f) => (
            <li key={f.contractId} class={styles.divider}>
              <button
                type="button"
                class={styles.btn}
                onClick={() => openSheet('Fight log', () => <FightLogView fight={f} />)}
              >
                {f.result === 'win' ? '✔' : '✘'} Tier {f.monster.tier} · {f.location} ▸
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
