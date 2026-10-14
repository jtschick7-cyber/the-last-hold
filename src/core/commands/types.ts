import type { AgeId } from '../../content/ages';
import type { BuildingId } from '../../content/buildings';
import type { GearSlot } from '../../content/gear';
import type { SceneId } from '../../content/text/scenes';
import type { HunterId } from '../../content/hunters';
import type { JobId } from '../../content/jobs';
import type { ConsumableId } from '../../content/consumables';
import type { IngredientId } from '../../content/ingredients';
import type { ResourceBundle } from '../../content/resources';
import type { PolicyId } from '../policies/schedules';
import type { Preparation, Settings } from '../state/game-state';
import type { UpgradeId } from '../../content/warden-upgrades';

// Technical design §4.3: every player action is a plain JSON Command, applied
// through apply(). The UI, the simulator and the debug panel all use these.
export type Command =
  /** Count buildings: a number of copies, or the most affordable ("Max"). */
  | { type: 'build.buy'; building: BuildingId; count: number | 'max' }
  /** Level buildings: the next level. */
  | { type: 'build.upgrade'; building: BuildingId }
  | { type: 'peasants.add'; job: JobId }
  | { type: 'peasants.remove'; job: JobId }
  /** Moves as many idle peasants into the job as its free slots allow. */
  | { type: 'peasants.fill'; job: JobId }
  /** Settles one peasant for food, whether or not auto-settle is on. */
  | { type: 'peasants.settle' }
  | { type: 'peasants.autoSettle'; on: boolean }
  | { type: 'peasants.priority'; order: JobId[] }
  | { type: 'age.up' }
  /** Sends a party on a board contract; `confirmReckless` is the dialog's answer (GDD §5.3.7). */
  | {
      type: 'contract.launch';
      contract: string;
      party: HunterId[];
      confirmReckless?: boolean;
      /** What the party carries (GDD §5.7); spent from the stores at launch. */
      prep?: Preparation;
    }
  | { type: 'contract.decline'; contract: string }
  /** Puts a board contract in a free Lodge slot (GDD §5.6.3). */
  | { type: 'investigate.assign'; contract: string }
  /** Takes a contract off its Lodge slot; the clues shown stay. */
  | { type: 'investigate.stop'; contract: string }
  /**
   * Queues a brew in the Alchemist's Hut; the recipe is paid now (GDD §5.7). `ingredients`
   * picks one of the recipes the book knows (GDD §5.8.2); without it, the v0.3 recipe or
   * the first known one.
   */
  | { type: 'brew.queue'; item: ConsumableId; ingredients?: Partial<Record<IngredientId, number>> }
  /** Queues an experiment: 1 of each ingredient in a kettle, paid now (GDD §5.8.3). */
  | { type: 'experiment.queue'; a: IngredientId; b: IngredientId }
  /** Cancels a queued brew or experiment and refunds it. */
  | { type: 'brew.cancel'; index: number }
  /** Acknowledges finished contracts; rewards were applied at completion (B9). */
  | { type: 'results.collect' }
  /** Remembers that a scene has been shown (setting-primer §6.6). */
  | { type: 'scene.seen'; scene: SceneId }
  | { type: 'hunter.recruit'; hunter: HunterId }
  /** Moves a hunter between the active roster and the reserve. */
  | { type: 'roster.set'; hunter: HunterId; active: boolean }
  | { type: 'gear.upgrade'; hunter: HunterId; slot: GearSlot }
  | { type: 'settings.set'; patch: Partial<Settings> }
  /** GDD §5.9.3: the Last Stand, then the Long Night. Final: there is no undo. */
  | {
      type: 'stand.make';
      party: HunterId[];
      /** One oil and one potion per hunter, from the stores; bombs are thrown automatically. */
      prep?: Pick<Preparation, 'oils' | 'potions'>;
    }
  /** The stand's result sheet has been read. */
  | { type: 'stand.seen' }
  /** GDD §5.9.5: one more level of a warden upgrade, for Embers. */
  | { type: 'upgrade.buy'; upgrade: UpgradeId }
  // Debug (technical design §15): only offered with ?debug or in dev builds.
  | { type: 'debug.skip'; ms: number }
  /** Plays a simulator policy over the last `ms`, then catches up to now (technical design §15). */
  | { type: 'debug.runPolicy'; policy: PolicyId; ms: number }
  | { type: 'debug.addResources'; bundle: ResourceBundle }
  | { type: 'debug.setSeed'; seed: string }
  | { type: 'debug.addEmbers'; amount: number }
  /** GDD §5.9.8: makes this save face the v0.4 arrival, as a pre-v0.4 save does. */
  /** GDD §5.14.5 (D152): name (or rename, from the Roll) the warden of a cycle; empty clears it. */
  | { type: 'warden.name'; cycle: number; name: string }
  /** GDD §5.14.1 (D149): a pre-v0.5 save meets Ilse and names its earlier wardens, by cycle. */
  | { type: 'story.arrive'; names: Record<number, string> }
  | { type: 'debug.runV05Arrival' }
  /** GDD §5.14.2: an Archive item has been opened; its badge goes. */
  | { type: 'archive.read'; key: string }
  | { type: 'debug.runArrival' }
  /** Plan T5.5: Arvid can't arrive in v0.5 (Act III isn't written), so this adds him. */
  | { type: 'debug.addArvid' }
  | { type: 'debug.unlockAge'; age: AgeId };

export type ApplyResult = { ok: true } | { ok: false; reason: string };

export const ok: ApplyResult = { ok: true };
export const refuse = (reason: string): ApplyResult => ({ ok: false, reason });
