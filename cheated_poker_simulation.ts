import {
  IPayTitleMap,
} from './src/video-poker/types';
import { allPayTitleToJudgeFuncMap } from './src/video-poker/supported-pay';
import { CheatedPokerGame } from './src/video-poker/game';
import { CheatedOptimalHoldTargetSelector } from './src/hold-target-selector/optimal-selector';
import Simulator from './src/simulator/simulator';

const testPayTable: IPayTitleMap<number> = {
  ROYAL_STRAIGHT_FLUSH: 250,
  STRAIGHT_FLUSH: 50,
  FOUR_OF_A_KIND: 25,
  FULL_HOUSE: 9,
  FLUSH: 6,
  STRAIGHT: 4,
  THREE_OF_A_KIND: 3,
  TWO_PAIR: 2,
  JACKS_OR_BETTER: 1,
};

const game = new CheatedPokerGame(testPayTable, allPayTitleToJudgeFuncMap);
const selector = new CheatedOptimalHoldTargetSelector(game);
const trialCount = 10000000;
const simulator = new Simulator(game, selector, 0);
simulator.emit.doneParallel = Simulator.printDefaultStatistics;
simulator.runParallel(trialCount);
