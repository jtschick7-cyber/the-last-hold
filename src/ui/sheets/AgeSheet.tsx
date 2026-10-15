import { ages } from '../../content/ages';
import { RESOURCE_IDS } from '../../content/resources';
import { ageUnlocks } from '../../core/describe';
import { formatNumber } from '../../core/format';
import { ageUpStatus } from '../../core/systems/ages';
import { dispatch, game, version } from '../app/runtime';
import { closeSheet, openSheet } from '../app/sheets';
import styles from '../styles/ui.module.css';
import { ResourceIcon } from '../widgets/ResourceIcon';
import { RiftglassShop } from '../delve/ShopCard';
import { HearthView } from './HearthView';
import { RollOfWardens } from './RollOfWardens';
import { SkillsView } from './SkillsView';
import { StandView } from './StandSheet';
import { standProblem } from '../../core/commands/stand';

// GDD §9.2 "Rank ▸" (D64: the player-facing word for an Age is Rank): what the next Rank restores, its checklist, its costs, and
// what it unlocks. At Bastion, the last Rank, the sheet shows what the hold has
// restored (GDD §9.13). The Citadel and Bastion restorations carry their
// inscriptions from v0.5 (D160, setting-primer §6.5).

export const RestorationView = ({ age }: { age: keyof typeof ages }) => {
  const r = ages[age].ageUp?.restores;
  if (!r) return null;
  return (
    <div>
      <h3 class={styles.cardTitle}>{r.summary}</h3>
      <p>{r.description}</p>
      {r.inscription && (
        <blockquote style={{ margin: 0, fontStyle: 'italic', color: 'var(--c-ember)' }}>
          “{r.inscription}”
        </blockquote>
      )}
    </div>
  );
};

export const AgeSheet = () => {
  void version.value;
  const s = game();
  const status = ageUpStatus(s);
  if (!status) {
    return (
      <div>
        <p>
          The hold is a <strong>{ages[s.cycle.age].name}</strong>.
        </p>
        <RestorationView age={s.cycle.age} />
        {s.cycle.age === 'bastion' && !standProblem(s) && (
          <button
            type="button"
            class={styles.btnPrimary}
            style={{ width: '100%', marginTop: 'var(--space-3)' }}
            onClick={() => openSheet('The Last Stand', () => <StandView />)}
          >
            Make the Last Stand
          </button>
        )}
        <HearthView />
        <RiftglassShop />
        <SkillsView />
        <RollOfWardens />
      </div>
    );
  }
  const up = ages[status.to].ageUp;
  const cost = { food: 0, wood: 0, iron: 0, silver: 0, ...(up?.cost ?? {}) };
  const become = (): void => {
    const to = status.to;
    if (dispatch({ type: 'age.up' }).ok) {
      closeSheet();
      openSheet(`A ${ages[to].name} again`, () => <RestorationView age={to} />);
    }
  };
  return (
    <div>
      <p class={styles.dim}>
        Next: {ages[status.to].name}. It restores: {up?.restores.summary}.
      </p>
      <h3 class={styles.cardTitle}>Requirements</h3>
      <ul class={styles.list}>
        {status.requirements.map((r) => (
          <li key={r.label} class={styles.row}>
            <span aria-hidden="true">{r.met ? '✔' : '○'}</span>
            <span class={`${styles.grow} ${r.met ? styles.good : ''}`}>{r.label}</span>
            <span>
              {r.have}/{r.need}
            </span>
          </li>
        ))}
      </ul>
      <h3 class={styles.cardTitle}>Cost</h3>
      <div class={styles.cost}>
        {RESOURCE_IDS.filter((r) => cost[r] > 0).map((r) => (
          <span key={r} class={s.resources[r] >= cost[r] ? undefined : styles.short}>
            <ResourceIcon r={r} /> {formatNumber(s.resources[r])} / {formatNumber(cost[r])}
          </span>
        ))}
      </div>
      <h3 class={styles.cardTitle} style={{ marginTop: 'var(--space-3)' }}>
        Unlocks
      </h3>
      <ul>
        {ageUnlocks(status.to).map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
      <button
        type="button"
        class={styles.btnPrimary}
        style={{ width: '100%' }}
        disabled={!status.ready}
        onClick={become}
      >
        Rank up to {ages[status.to].name}
      </button>
      <HearthView />
      <RiftglassShop />
      <SkillsView />
      <RollOfWardens />
    </div>
  );
};
