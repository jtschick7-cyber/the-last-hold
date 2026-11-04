import { useMemo } from 'preact/hooks';
import { contractPlayback } from '../../core/contracts/playback';
import type { FightRef } from '../../core/state/game-state';
import { game } from '../app/runtime';
import { closeSheet, openSheet } from '../app/sheets';
import { PlaybackView } from '../delve/PlaybackView';
import styles from '../styles/ui.module.css';

// GDD §9.4, technical design §24.2 (v1.7, D606, D610): optional Arena replay for a settled contract
// fight. Shows Skip, Log, and Done; shows OLDER_RULES_NOTE when replay differs; plays no Win/Lose
// result jingle at completion or on Skip (re-watching an already-settled contract obeys D522).
export const ContractPlaybackSheet = ({ fight }: { fight: FightRef }) => {
  const pb = useMemo(() => contractPlayback(game(), fight), [fight.seed, fight.at]);
  const lastLine = pb.steps[pb.steps.length - 1]?.text ?? null;
  return (
    <div>
      {pb.olderNote && <p class={`${styles.small} ${styles.warn}`}>{pb.olderNote}</p>}
      <PlaybackView
        pb={pb}
        continueLabel="Done"
        outcome={lastLine}
        opening=""
        onContinue={closeSheet}
      />
    </div>
  );
};

export const openContractPlayback = (fight: FightRef): void => {
  const pb = contractPlayback(game(), fight);
  openSheet(pb.title, () => <ContractPlaybackSheet fight={fight} />);
};
