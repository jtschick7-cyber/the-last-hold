import { useEffect, useMemo, useState } from 'preact/hooks';
import { monsterPortraitId } from '../../content/assets';
import { hunters, roleNames, type HunterId } from '../../content/hunters';
import { villages } from '../../content/villages';
import { constantAt } from '../../core/balance-access';
import { formatDuration, formatNumber } from '../../core/format';
import { maxPartySize } from '../../core/contracts/party';
import { provisions } from '../../core/contracts/rewards';
import { oddsTarget } from '../../core/investigation/knowledge';
import { contractIdentity } from '../../core/investigation/view';
import {
  noPreparation,
  type ContractInstance,
  type Preparation,
} from '../../core/state/game-state';
import { timeToAfford } from '../../core/systems/costs';
import { availableHunters, snapshotOf } from '../../core/systems/hunters';
import { productionRate } from '../../core/systems/production';
import { abilityLines, pct, resistLines } from '../app/contract-text';
import { candidateList, identityText } from '../app/knowledge-text';
import { debounced, requestSuggest, type OddsAnswer } from '../app/odds-client';
import { dispatch, game, version } from '../app/runtime';
import { closeSheet, openSheet } from '../app/sheets';
import styles from '../styles/ui.module.css';
import { Num } from '../widgets/Num';
import { ResourceIcon } from '../widgets/ResourceIcon';
import { InvestigationPanel } from '../widgets/InvestigationPanel';
import { Sprite } from '../widgets/Sprite';
import { BreakdownView } from './BreakdownView';
import { PreparationPicker } from './PreparationPicker';

// GDD §9.5: the launch sheet. Pick a party (or Suggest), read the odds, pay
// provisions, send. Reckless contracts (under 35%) turn the button red and ask
// for a confirmation that names each hunter's death chance (GDD §5.3.7).

const ConfirmReckless = ({
  contract,
  party,
  prep,
  deaths,
}: {
  contract: ContractInstance;
  party: HunterId[];
  prep: Preparation;
  deaths: Record<string, number>;
}) => (
  <div>
    <p>
      This is a <strong class={styles.warn}>Reckless</strong> contract. If a hunter is downed, they
      may not come back:
    </p>
    <ul class={styles.list}>
      {party.map((id) => (
        <li key={id} class={styles.divider}>
          {hunters[id].name}:{' '}
          {hunters[id].story ? (
            <span>can't die; a downed hunter is grievously wounded instead</span>
          ) : (
            <strong class={styles.warn}>{pct(deaths[id] ?? 0)} chance of death</strong>
          )}
        </li>
      ))}
    </ul>
    <button
      type="button"
      class={styles.btnPrimary}
      style={{ width: '100%', background: 'var(--c-warn)' }}
      onClick={() => {
        if (
          dispatch({
            type: 'contract.launch',
            contract: contract.id,
            party,
            confirmReckless: true,
            prep,
          }).ok
        ) {
          closeSheet();
          closeSheet();
        }
      }}
    >
      Send them anyway
    </button>
  </div>
);

export const LaunchView = ({ contractId }: { contractId: string }) => {
  void version.value;
  const s = game();
  const contract = s.board.open.find((c) => c.id === contractId);
  const free = availableHunters(s);
  const max = contract ? maxPartySize(contract.tier, s.cycle.age) : 0;
  const [party, setParty] = useState<HunterId[]>(() => free.slice(0, max));
  const chosen = useMemo(
    () => free.filter((h) => party.includes(h)),
    [party.join(','), free.join(',')],
  );
  // What the party carries; only hunters who are going count (GDD §5.7).
  const [prep, setPrep] = useState<Preparation>(noPreparation());
  const activePrep = useMemo<Preparation>(
    () => ({
      oils: Object.fromEntries(
        Object.entries(prep.oils).filter(([h]) => chosen.includes(h as HunterId)),
      ),
      potions: Object.fromEntries(
        Object.entries(prep.potions).filter(([h]) => chosen.includes(h as HunterId)),
      ),
      bombs: prep.bombs,
    }),
    [JSON.stringify(prep), chosen.join(',')],
  );
  const prepared =
    Object.keys(activePrep.oils).length +
      Object.keys(activePrep.potions).length +
      activePrep.bombs.length >
    0;
  // Odds come from a worker, debounced; the last answer stays on screen, dimmed, while a new one is worked out.
  const [answer, setAnswer] = useState<OddsAnswer | null>(null);
  const [busy, setBusy] = useState(false);
  const ask = useMemo(() => debounced(), []);
  // "Unprepared would be X%" (GDD §9.5): the same odds with nothing carried.
  const askBare = useMemo(() => debounced(), []);
  const [bare, setBare] = useState<number | null>(null);
  useEffect(() => {
    if (!contract || chosen.length === 0) {
      setAnswer(null);
      return;
    }
    let live = true;
    setBusy(true);
    const base = {
      gameSeed: s.meta.gameSeed,
      contractId: contract.id,
      party: chosen.map((h) => snapshotOf(s, h)),
      monster: oddsTarget(s, contract),
      location: contract.location,
      rank: s.cycle.age,
    };
    void ask({ ...base, prep: activePrep }).then((a) => {
      if (!live || a === null) return;
      setAnswer(a);
      setBusy(false);
    });
    if (prepared) {
      void askBare(base).then((a) => {
        if (live && a !== null) setBare(a.odds.winChance);
      });
    } else setBare(null);
    return () => {
      live = false;
    };
  }, [contractId, chosen.join(','), JSON.stringify(activePrep), contract?.revealed]);
  const odds = answer?.odds ?? null;
  if (!contract) return <p>That contract is no longer on the board.</p>;
  const identity = contractIdentity(s, contract);
  const known = identity.identified && identity.monster !== null;
  const { weak, resists } =
    known && identity.monster ? resistLines(identity.monster) : { weak: '', resists: '' };
  const food = provisions(s, chosen.length, contract.tier);
  const short = s.resources.food < food.value;
  const wait = short
    ? timeToAfford(
        s,
        { food: food.value, wood: 0, iron: 0, silver: 0 },
        (r) => productionRate(s, r).value,
      )
    : 0;
  const toggle = (id: HunterId): void =>
    setParty(
      party.includes(id)
        ? party.filter((h) => h !== id)
        : party.length < max
          ? [...party, id]
          : party,
    );
  const suggest = async (): Promise<void> => {
    setBusy(true);
    const pick = await requestSuggest({
      gameSeed: s.meta.gameSeed,
      contractId: contract.id,
      available: free.map((h) => snapshotOf(s, h)),
      monster: oddsTarget(s, contract),
      location: contract.location,
      rank: s.cycle.age,
      maxParty: max,
      prep: activePrep,
    });
    if (pick) setParty(pick.party.map((p) => p.id));
    setBusy(false);
  };
  const send = (): void => {
    if (!odds) return;
    if (odds.reckless) {
      const deaths = Object.fromEntries(odds.hunters.map((h) => [h.id, h.death]));
      openSheet('Send them anyway?', () => (
        <ConfirmReckless contract={contract} party={chosen} prep={activePrep} deaths={deaths} />
      ));
      return;
    }
    if (
      dispatch({ type: 'contract.launch', contract: contract.id, party: chosen, prep: activePrep })
        .ok
    )
      closeSheet();
  };
  return (
    <div>
      <div class={styles.row}>
        {known && identity.monster ? (
          <Sprite id={monsterPortraitId(identity.monster)} />
        ) : (
          <span class={styles.unknownBox} role="img" aria-label="Unknown monster">
            ?
          </span>
        )}
        <div class={styles.grow}>
          <strong>
            {villages[contract.village].name} · {identityText(identity)} · T{contract.tier}
          </strong>
          <div class={`${styles.small} ${styles.dim}`}>
            {known && identity.monster ? (
              <>
                weak: {weak}
                <br />
                resists: {resists}
                <br />
                {abilityLines(identity.monster).join(' · ')}
              </>
            ) : (
              <>
                {candidateList(identity.candidates)}
                <br />
                Resistances and abilities show once it is identified.
              </>
            )}
          </div>
        </div>
      </div>
      <InvestigationPanel contractId={contract.id} />
      <div class={styles.row}>
        <h3 class={`${styles.cardTitle} ${styles.grow}`}>
          Party ({chosen.length}/{max})
        </h3>
        <button
          type="button"
          class={styles.btn}
          onClick={() => void suggest()}
          disabled={free.length === 0}
        >
          Suggest best
        </button>
      </div>
      {free.length === 0 && (
        <p class={styles.dim}>
          Nobody is free to go. Hunters on a contract or recovering can't be sent.
        </p>
      )}
      <ul class={styles.list}>
        {free.map((id) => (
          <li key={id} class={styles.divider}>
            <label class={styles.row}>
              <input type="checkbox" checked={party.includes(id)} onChange={() => toggle(id)} />
              <span class={styles.grow}>
                {hunters[id].name}{' '}
                <span class={`${styles.small} ${styles.dim}`}>
                  {roleNames[hunters[id].role]} · {hunters[id].damage} · Lv {s.hunters[id]?.level}
                </span>
              </span>
            </label>
          </li>
        ))}
      </ul>
      <PreparationPicker
        state={s}
        party={chosen}
        prep={activePrep}
        identity={identity}
        onChange={setPrep}
      />
      {odds && (
        <div class={styles.card} style={busy ? { opacity: 0.6 } : undefined}>
          <div class={styles.row}>
            <strong class={odds.reckless ? styles.warn : undefined}>
              ODDS {pct(odds.winChance)} ±{Math.round(odds.margin * 100)}
            </strong>
            <span class={styles.grow} />
            <button
              type="button"
              class={styles.btn}
              onClick={() =>
                openSheet('Why these odds', () => <BreakdownView breakdown={odds.why} />)
              }
            >
              Why ▸
            </button>
          </div>
          {odds.assumesUnidentified && (
            <div class={`${styles.small} ${styles.dim}`}>
              Odds assume an unidentified monster: {odds.candidates.length} candidates.
            </div>
          )}
          {prepared && bare !== null && (
            <div class={`${styles.small} ${styles.dim}`}>unprepared would be {pct(bare)}</div>
          )}
          {answer?.quick && (
            <div class={`${styles.small} ${styles.warn}`}>
              Quick estimate ({odds.samples} fights): this device couldn't run the full 500.
            </div>
          )}
          {odds.hunters.map((h) => (
            <div key={h.id} class={`${styles.small} ${styles.dim}`}>
              {hunters[h.id as HunterId].shortName}: {pct(h.downed)} wounded
              {h.bruised > 0.005 ? `, ${pct(h.bruised)} bruised` : ''}
              {odds.reckless && h.death > 0 ? ` · ${pct(h.death)} death` : ''}
            </div>
          ))}
          <div class={`${styles.cost} ${styles.small}`}>
            <span>
              ~{formatNumber(odds.expectedBounty)} <ResourceIcon r="silver" />
            </span>
            <span>🏆 {odds.expectedTrophies.toFixed(1)}</span>
            <span>{formatDuration(contractSeconds(contract))}</span>
          </div>
        </div>
      )}
      <p class={short ? styles.warn : styles.dim}>
        Provisions <ResourceIcon r="food" />{' '}
        <Num text={formatNumber(food.value)} breakdown={() => food.breakdown} /> (paid at launch)
        {short && wait !== null && wait > 0 ? ` · affordable in ~${formatDuration(wait)}` : ''}
      </p>
      <button
        type="button"
        class={styles.btnPrimary}
        style={{ width: '100%', ...(odds?.reckless ? { background: 'var(--c-warn)' } : {}) }}
        disabled={!odds || short || busy}
        onClick={send}
      >
        {odds?.reckless ? 'Send them anyway' : 'Send the hunters'}
      </button>
    </div>
  );
};

const contractSeconds = (c: ContractInstance): number =>
  (constantAt('contract.duration').value as readonly number[])[c.tier - 1] ?? 0;
