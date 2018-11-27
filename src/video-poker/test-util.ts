import {
    TCard,
    IPayTitleMap,
    IPayCalculator,
} from './types';
import Deck from './deck';

export class PayCalculatorTester<K extends IPayCalculator> {
  pay_calculator: K;
  statistics: IPayTitleMap<number>;

  constructor(payCalculator: K) {
    this.pay_calculator = payCalculator;
    const emptyStatistics: IPayTitleMap<number> = {};
    for (let key in this.pay_calculator.pay_table) {
      emptyStatistics[key] = 0;
    }
    this.statistics = emptyStatistics;
  }

  calculatePayForAllPossibleHand() {
    const newDeck = new Deck();
    const cardList = newDeck.card_list;
    const allPossibleHandList: TCard[][] = [];
    for (let i1 = 0; i1 < cardList.length - 4; ++i1) {
      for (let i2 = i1 + 1; i2 < cardList.length - 3; ++i2) {
        for (let i3 = i2 + 1; i3 < cardList.length - 2; ++i3) {
          for (let i4 = i3 + 1; i4 < cardList.length - 1; ++i4) {
            for (let i5 = i4 + 1; i5 < cardList.length; ++i5) {
              allPossibleHandList.push([
                cardList[i1],
                cardList[i2],
                cardList[i3],
                cardList[i4],
                cardList[i5],
              ]);
            }
          }
        }
      }
    }
    console.log("ALL POSSIBLE HAND COUNT: " + allPossibleHandList.length);

    for (let i = 0; i < allPossibleHandList.length; ++i) {
      const hand = allPossibleHandList[i];
      const result = this.pay_calculator.calculateHandResult(hand);
      if (result.pay_title) {
        this.statistics[result.pay_title]++;
      }
    }

    return this.statistics;
  }
}
