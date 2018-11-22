import { UltimateXPokerGame, OptimalHoldTargetSelector, Simulator, allPayTitleToJudgeFuncMap, IPayTitleMap } from './simulator';

// WARNING: property should be ordered by priority (higher first)
// e.g.) JAKCS_OR_BETTER should located after FULL_HOUSE.
// If not, FULL_HOUSE hand can be payed as if it is JACKS_OR_BETTER
const testPayTable: IPayTitleMap<number> = {
  ROYAL_STRAIGHT_FLUSH: 250,
  STRAIGHT_FLUSH: 50,
  FOUR_OF_A_KIND: 25,
  FULL_HOUSE: 6,
  FLUSH: 5,
  STRAIGHT: 4,
  THREE_OF_A_KIND: 3,
  TWO_PAIR: 2,
  JACKS_OR_BETTER: 1,
};

const testPayMultiplierTable: IPayTitleMap<number> = {
  ROYAL_STRAIGHT_FLUSH: 7,
  STRAIGHT_FLUSH: 7,
  FOUR_OF_A_KIND: 3,
  FULL_HOUSE: 12,
  FLUSH: 11,
  STRAIGHT: 7,
  THREE_OF_A_KIND: 4,
  TWO_PAIR: 3,
  JACKS_OR_BETTER: 2,
};

const game = new UltimateXPokerGame(testPayTable, allPayTitleToJudgeFuncMap, testPayMultiplierTable);
const selector = new OptimalHoldTargetSelector(game.pay_calculator);
const trialCount = 10000000;
const simulator = new Simulator(game, selector, 0);
simulator.emit.doneParallel = Simulator.printDefaultStatistics;
simulator.runParallel(trialCount);
