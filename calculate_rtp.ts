import {
  IPayTitleMap,
} from './src/video-poker/types';
import { allPayTitleToJudgeFuncMap } from './src/video-poker/supported-pay';
import { BasicPokerGame } from './src/video-poker/game';
import { OptimalHoldTargetSelector } from './src/hold-target-selector/optimal-selector';
import RTPCalculator from './src/rtp-caculator/rtp-calculator';

// WARNING: property should be ordered by priority (higher first)
// e.g.) JAKCS_OR_BETTER should located after FULL_HOUSE.
// If not, FULL_HOUSE hand can be payed as if it is JACKS_OR_BETTER
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

const game = new BasicPokerGame(testPayTable, allPayTitleToJudgeFuncMap);
const selector = new OptimalHoldTargetSelector(game.pay_calculator);
const rtpCalculator = new RTPCalculator(game.pay_calculator.pay_table, selector);
rtpCalculator.emit.doneParallel = rtpCalculator.printDefaultStatistics.bind(rtpCalculator);
rtpCalculator.calculateRTPParallel();
