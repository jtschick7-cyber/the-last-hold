import { hunters } from '../../content/hunters';
import { monsterPortraitId, RIBBON_ICON } from '../../content/assets';
import { ingredients, type IngredientId } from '../../content/ingredients';
import { monsters } from '../../content/monsters';
import { formatDuration, formatNumber } from '../../core/format';
import type { ContractResult } from '../../core/state/game-state';
import { foundLines } from '../../core/story/found-lines';
import { emberNews, game, version } from '../app/runtime';
import { openSheet } from '../app/sheets';
import { placeName } from '../app/contract-text';
import styles from '../styles/ui.module.css';
import { ResourceIcon } from '../widgets/ResourceIcon';
import { Sprite } from '../widgets/Sprite';
import { FightLogView } from './FightLogSheet';
import { ReadyLine } from '../remembering/ReadyLine';

const INJURY: Record<string, string> = {
  bruised: 'bruised',
  wounded: 'wounded',
  grievous: 'grievously wounded',
  dead: 'killed',
};

// GDD §9.4 "Collect": every finished contract at once, as an away-sheet style
// summary (GDD §5.4.3). The rewards were applied when each timer ended.
export const ResultLine = ({ r, now }: { r: ContractResult; now: number }) => {
  void version.value;
  const fight = game().log.recentFights.find((f) => f.contractId === r.contractId);
  return (
    <li class={styles.divider} style={{ padding: 'var(--space-2) 0' }}>
      <div class={styles.row}>
        <Sprite id={monsterPortraitId(r.monster)} />
        <div class={styles.grow}>
          <strong class={r.success ? styles.good : styles.warn}>
            {r.success ? '✔' : '✘'} {monsters[r.monster].name} · T{r.tier}
          </strong>
          <div class={`${styles.small} ${styles.dim}`}>
            {placeName(r)} · finished {formatDuration((now - r.at) / 1000)} ago
          </div>
        </div>
      </div>
      {r.success ? (
        <div class={`${styles.cost} ${styles.rewardTally}`}>
          <span>
            +{formatNumber(r.bounty)} <ResourceIcon r="silver" />
          </span>
          <span>🏆 {r.trophies}</span>
          <span>{r.xp} XP each</span>
        </div>
      ) : (
        <div class={styles.small}>No bounty. {r.xp} XP each.</div>
      )}
      {r.success && r.wellPrepared && (
        <div class={`${styles.small} ${styles.good}`}>
          Well prepared: ×1.5 bounty and +1 trophy.
        </div>
      )}
      {Object.keys(r.reagents).length > 0 && (
        <div class={styles.small}>
          Reagents:{' '}
          {Object.entries(r.reagents)
            .map(([k, n]) => `${n} ${ingredients[k as IngredientId].name.toLowerCase()}`)
            .join(', ')}
        </div>
      )}
      {(r.found ?? []).some((k) => k.startsWith('ribbon:')) && (
        <div>
          <Sprite id={RIBBON_ICON} />
        </div>
      )}
      {foundLines(game(), r.found ?? []).map((line) => (
        <div key={line} class={styles.small}>
          <em>{line}</em>
        </div>
      ))}
      {r.levelUps.map((l) => (
        <div key={l.hunter} class={`${styles.small} ${styles.good}`}>
          {hunters[l.hunter].shortName} reached level {l.level}
        </div>
      ))}
      {r.injuries.map((i) => (
        <div key={i.hunter} class={`${styles.small} ${i.kind === 'dead' ? styles.warn : ''}`}>
          {hunters[i.hunter].shortName} {INJURY[i.kind] ?? i.kind}
          {i.kind !== 'dead' && i.until > now
            ? ` · back in ${formatDuration((i.until - now) / 1000)}`
            : ''}
        </div>
      ))}
      {fight && (
        <button
          type="button"
          class={styles.btn}
          onClick={() => openSheet('Fight log', () => <FightLogView fight={fight} />)}
        >
          Fight log ▸
        </button>
      )}
    </li>
  );
};

export const ResultsView = ({
  results,
  ember,
}: {
  results: readonly ContractResult[];
  /** Live results also carry the skill level-ups since the game opened (GDD §5.8.6). */
  ember?: boolean;
}) => {
  const now = game().time;
  return (
    <>
      {ember &&
        emberNews.value.map((line, i) => (
          <p key={i} class={`${styles.small} ${styles.good}`}>
            {line}
          </p>
        ))}
      <ul class={styles.list}>
        {results.map((r) => (
          <ResultLine key={r.contractId} r={r} now={now} />
        ))}
      </ul>
      {ember && <ReadyLine />}
    </>
  );
};
