import { debugStartActThree, startActThree } from './act3';
import { debugStartAct, startActOnLoad } from './act-start';
import { debugGrantLoot, debugReadyRanks } from './debug-depth';
import {
  debugOrdersAddStanding,
  debugOrdersClearCooldown,
  debugOrdersOpen,
  debugOrdersOpenThird,
  debugOrdersPlayChapter,
  debugOrdersReset,
  debugOrdersSetLevel,
} from './debug-orders';
import { debugLayoutAutoArrange, debugLayoutClear, debugLayoutFillBastion } from './debug-layout';
import { debugAddToken, debugEndRests, debugFillBank } from './debug-events';
import { bossAttempt, seeEventsScene } from './boss';
import { addStar, rankUp } from './hunter-depth';
import { craftItem, equipFromStores, reworkItem, salvageItem, unequipItem } from './items';
import { debugUnlit } from './unlit';
import { equipKeepsake, pickTalent, respecTalents, unequipKeepsake } from './talents';
import {
  buyAlternateTrait,
  buyChosenStart,
  buyCosmetic,
  buyLateHours,
  buyReroll,
  switchTrait,
} from '../delves/shop';
import {
  ackResult,
  chooseBlessing,
  chooseDoor,
  chooseStartPatron,
  fightFloor,
  leaveRun,
  rerollOffer,
  seeScene,
  startRun,
} from '../delves/run';
import { arriveV05, nameWarden, readArchive, runV05Arrival } from './wardens';
import type { GameState } from '../state/game-state';
import { ageUp } from './age';
import { collect, decline, launch, markSeen } from './contracts';
import { cancelBrew, queueBrew, queueExperiment } from './brew';
import { assign, stop } from './investigate';
import { huntAttempt } from './hunt';
import { recruit, setActive, upgradeGear } from './roster';
import { buy, upgrade } from './build';
import {
  addEmbers,
  addResources,
  runArrival,
  runPolicy,
  setSeed,
  skip,
  unlockAge,
  addArvid,
} from './debug';
import { add, fill, remove, setAutoSettle, setPriority, settle } from './peasants';
import { setSettings } from './settings';
import { makeStand, markStandSeen } from './stand';
import { buyUpgrade } from './hearth';
import {
  finishOpening,
  readChapter,
  seatOrder,
  setSeats,
  skipSeatStep,
  swapOrders,
  unseatOrder,
} from './orders';
import { openOrders } from '../systems/orders-open';
import { autoPlaceUnlocked, unlockedPieces } from '../systems/layout-place';
import {
  layoutAutoArrange,
  layoutClear,
  layoutPlace,
  layoutSetShowGhosts,
  layoutUnplace,
} from './layout';
import { chooseEnding, noteReady, seeNear } from './remembering';
import { debugVigilSetStands, vigilSet } from './vigil';
import { debugRememberingFinishActVI, debugRememberingOpenGate } from './debug-remembering';
import { refuse, type ApplyResult, type Command } from './types';

/**
 * Technical design §4.3: applies one player action. Validates first, so a
 * refused command never changes state. The caller has already advanced the
 * state to `now`; only the debug time skip uses it in v0.1. A clock moved
 * backward is ignored, never refused (D21).
 */
/** GDD §5.13.1: a building may be the first Alchemist's Hut, which opens the Grey Wives. */
const opening = (state: GameState, result: ApplyResult): ApplyResult => {
  if (result.ok) openOrders(state, state.time);
  return result;
};

/** Plan TL.3: a piece that a purchase unlocks takes its saved spot, or the first free tile (GDD §5.1.5). */
const placing = (state: GameState, run: () => ApplyResult): ApplyResult => {
  const before = unlockedPieces(state);
  const result = run();
  if (result.ok) autoPlaceUnlocked(state, before);
  return result;
};

/** A Rank-up opens ground: waiting pieces wake, and the tray is placed (GDD §5.1.5 rule 5). */
const rankingUp = (state: GameState): ApplyResult => {
  const result = ageUp(state);
  if (result.ok) autoPlaceUnlocked(state);
  return result;
};

export const apply = (state: GameState, cmd: Command, now: number): ApplyResult => {
  switch (cmd.type) {
    case 'build.buy':
      return placing(state, () => opening(state, buy(state, cmd.building, cmd.count)));
    case 'build.upgrade':
      return placing(state, () => opening(state, upgrade(state, cmd.building)));
    case 'peasants.add':
      return add(state, cmd.job);
    case 'peasants.remove':
      return remove(state, cmd.job);
    case 'peasants.fill':
      return fill(state, cmd.job);
    case 'peasants.settle':
      return settle(state);
    case 'peasants.autoSettle':
      return setAutoSettle(state, cmd.on);
    case 'peasants.priority':
      return setPriority(state, cmd.order);
    case 'age.up':
      return rankingUp(state);
    case 'layout.place':
      return layoutPlace(state, cmd.pieceId, cmd.x, cmd.y);
    case 'layout.unplace':
      return layoutUnplace(state, cmd.pieceId);
    case 'layout.autoArrange':
      return layoutAutoArrange(state);
    case 'layout.clear':
      return layoutClear(state);
    case 'layout.setShowGhosts':
      return layoutSetShowGhosts(state, cmd.showGhosts);
    case 'contract.launch':
      return launch(state, cmd.contract, cmd.party, cmd.confirmReckless === true, cmd.prep);
    case 'contract.decline':
      return decline(state, cmd.contract);
    case 'investigate.assign':
      return assign(state, cmd.contract);
    case 'investigate.stop':
      return stop(state, cmd.contract);
    case 'brew.queue':
      return queueBrew(state, cmd.item, cmd.ingredients);
    case 'experiment.queue':
      return queueExperiment(state, cmd.a, cmd.b);
    case 'brew.cancel':
      return cancelBrew(state, cmd.index);
    case 'results.collect':
      return collect(state);
    case 'scene.seen':
      return markSeen(state, cmd.scene);
    case 'hunter.recruit':
      return recruit(state, cmd.hunter);
    case 'roster.set':
      return setActive(state, cmd.hunter, cmd.active);
    case 'gear.upgrade':
      return upgradeGear(state, cmd.hunter, cmd.slot);
    case 'events.seeScene':
      return seeEventsScene(state);
    case 'boss.attempt':
      return bossAttempt(state, cmd.party, cmd.prep, now);
    case 'hunt.attempt':
      return huntAttempt(state, cmd.track, cmd.party, cmd.prep, now);
    case 'settings.set':
      return setSettings(state, cmd.patch);
    case 'stand.make':
      return makeStand(state, cmd.party, cmd.prep ?? { oils: {}, potions: {} });
    case 'stand.seen':
      return markStandSeen(state);
    case 'upgrade.buy':
      return buyUpgrade(state, cmd.upgrade);
    case 'orders.seat':
      return seatOrder(state, cmd.order, now);
    case 'orders.unseat':
      return unseatOrder(state, cmd.order, now);
    case 'orders.swap':
      return swapOrders(state, cmd.out, cmd.in, now);
    case 'orders.readChapter':
      return readChapter(state, cmd.order);
    case 'orders.finishOpening':
      return finishOpening(state, cmd.order, cmd.seatIt);
    case 'orders.skipSeatStep':
      return skipSeatStep(state);
    case 'orders.setSeats':
      return setSeats(state, cmd.orders);
    case 'vigil.set':
      return vigilSet(state, cmd.on);
    case 'debug.vigilSetStands':
      return debugVigilSetStands(state, cmd.stands);
    case 'remembering.seeNear':
      return seeNear(state);
    case 'remembering.choose':
      return chooseEnding(state, cmd.ending, now);
    case 'debug.rememberingOpenGate':
      return debugRememberingOpenGate(state);
    case 'debug.rememberingFinishActVI':
      return debugRememberingFinishActVI(state);
    case 'remembering.noteReady':
      return noteReady(state);
    case 'debug.ordersOpen':
      return debugOrdersOpen(state, cmd.order, now);
    case 'debug.ordersAddStanding':
      return debugOrdersAddStanding(state, cmd.order, cmd.amount);
    case 'debug.ordersSetLevel':
      return debugOrdersSetLevel(state, cmd.order, cmd.level);
    case 'debug.ordersOpenThird':
      return debugOrdersOpenThird(state);
    case 'debug.ordersClearCooldown':
      return debugOrdersClearCooldown(state);
    case 'debug.ordersPlayChapter':
      return debugOrdersPlayChapter(state, cmd.order, cmd.chapter, now);
    case 'debug.ordersReset':
      return debugOrdersReset(state);
    case 'debug.skip':
      return skip(state, cmd.ms, now);
    case 'debug.runPolicy':
      return runPolicy(state, cmd.policy, cmd.ms, now);
    case 'debug.addResources':
      return addResources(state, cmd.bundle);
    case 'debug.setSeed':
      return setSeed(state, cmd.seed);
    case 'debug.addEmbers':
      return addEmbers(state, cmd.amount);
    case 'debug.addToken':
      return debugAddToken(state, now);
    case 'debug.fillBank':
      return debugFillBank(state, now);
    case 'debug.endRests':
      return debugEndRests(state);
    case 'debug.grantLoot':
      return debugGrantLoot(state);
    case 'debug.readyRanks':
      return debugReadyRanks(state);
    case 'debug.runArrival':
      return runArrival(state);
    case 'debug.layoutAutoArrange':
      return debugLayoutAutoArrange(state);
    case 'debug.layoutClear':
      return debugLayoutClear(state);
    case 'debug.layoutFillBastion':
      return debugLayoutFillBastion(state);
    case 'debug.unlockAge':
      return unlockAge(state, cmd.age);
    case 'debug.addArvid':
      return addArvid(state);
    case 'warden.name':
      return nameWarden(state, cmd.cycle, cmd.name);
    case 'story.arrive':
      return arriveV05(state, cmd.names);
    case 'story.startActIII':
      return startActThree(state);
    case 'debug.startActIII':
      return debugStartActThree(state);
    case 'delve.start':
      return startRun(state, cmd.party);
    case 'delve.chooseStart':
      return chooseStartPatron(state, cmd.patron);
    case 'delve.chooseDoor':
      return chooseDoor(state, cmd.patron);
    case 'delve.chooseBlessing':
      return chooseBlessing(state, cmd.blessing);
    case 'delve.reroll':
      return rerollOffer(state);
    case 'delve.fight':
      return fightFloor(state);
    case 'delve.leave':
      return leaveRun(state);
    case 'delve.ackResult':
      return ackResult(state);
    case 'delve.seeScene':
      return seeScene(state);
    case 'riftglass.buy':
      return cmd.item === 'late-hours'
        ? buyLateHours(state)
        : cmd.item === 'chosen-start'
          ? buyChosenStart(state)
          : buyReroll(state);
    case 'riftglass.buyTrait':
      return buyAlternateTrait(state, cmd.hunter);
    case 'riftglass.buyCosmetic':
      return buyCosmetic(state, cmd.cosmetic);
    case 'riftglass.switchTrait':
      return switchTrait(state, cmd.hunter, cmd.alternate);
    case 'hunter.rankUp':
      return rankUp(state, cmd.hunter);
    case 'hunter.addStar':
      return addStar(state, cmd.hunter);
    case 'talent.pick':
      return pickTalent(state, cmd.hunter, cmd.talent);
    case 'talent.respec':
      return respecTalents(state, cmd.hunter);
    case 'keepsake.equip':
      return equipKeepsake(state, cmd.hunter, cmd.legendary);
    case 'keepsake.unequip':
      return unequipKeepsake(state, cmd.hunter);
    case 'item.craft':
      return craftItem(state, cmd.base);
    case 'item.rework':
      return reworkItem(state, cmd.item);
    case 'item.equip':
      return equipFromStores(state, cmd.item, cmd.hunter);
    case 'item.unequip':
      return unequipItem(state, cmd.hunter, cmd.slot);
    case 'item.salvage':
      return salvageItem(state, cmd.item);
    case 'story.startAct':
      return startActOnLoad(state);
    case 'debug.startAct':
      return debugStartAct(state, cmd.act);
    case 'debug.unlit':
      return debugUnlit(state, cmd.open);
    case 'debug.runV05Arrival':
      return runV05Arrival(state);
    case 'archive.read':
      return readArchive(state, cmd.key);
    default:
      return refuse('Unknown command.');
  }
};
