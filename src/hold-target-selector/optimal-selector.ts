import {
    TCard,
    IPayTitleMap,
} from '../video-poker/types';
import Deck from '../video-poker/deck';
import PayCalculator from '../video-poker/pay-calculator'
import { CheatedPokerGame } from '../video-poker/game';
import {
  IExpectedOutcome,
  IHoldTargetSelector,
  IOptimalHoldTargetSelector,
} from './types';
import { combination, subsets, subsetsWithoutEmpty, cardListToIndex, mergeByAdd, mergeBySubtract } from './util';
import * as crypto from 'crypto';
import * as fs from 'fs';

const _52C5 = combination(52, 5);
const _52C4 = combination(52, 4);
const _52C3 = combination(52, 3);
const _52C2 = combination(52, 2);
const _52C1 = combination(52, 1);
const _52C0 = combination(52, 0);

const _47C0 = combination(47, 0);
const _48C1 = combination(48, 1);
const _49C2 = combination(49, 2);
const _50C3 = combination(50, 3);
const _51C4 = combination(51, 4);

// Implementation of https://wizardofodds.com/games/video-poker/methodology/
export class OptimalHoldTargetSelector implements IOptimalHoldTargetSelector {
  pay_calculator: PayCalculator;
  private discard5ValueMapList: Readonly<IExpectedOutcome>[];
  private discard4ValueMapList: Readonly<IExpectedOutcome>[];
  private discard3ValueMapList: Readonly<IExpectedOutcome>[];
  private discard2ValueMapList: Readonly<IExpectedOutcome>[];
  private discard1ValueMapList: Readonly<IExpectedOutcome>[];
  private discard0ValueList: (keyof IPayTitleMap<number>)[];

  constructor(payCalculator: PayCalculator) {
    this.pay_calculator = payCalculator;

    console.log("Start optimal selector init");
    console.log("Trying load discard value table from file");
    const hashGenerator = crypto.createHash('md5');
    // use getOwnPropertyNames to guarantee string property to be ordered by its creation order
    hashGenerator.update(JSON.stringify(Object.entries(this.pay_calculator.pay_table).sort((a,b) => b[1]-a[1])));
    const payTableHash = hashGenerator.digest('hex');
    const fileCacheName = `filecache_${payTableHash}`;
    try {
      const fileContent = fs.readFileSync(fileCacheName, 'utf8');
      const discardValueMapListStringList = fileContent.trim().split('\n');
      this.discard0ValueList = JSON.parse(discardValueMapListStringList[0]);
      this.discard1ValueMapList = JSON.parse(discardValueMapListStringList[1]);
      this.discard2ValueMapList = JSON.parse(discardValueMapListStringList[2]);
      this.discard3ValueMapList = JSON.parse(discardValueMapListStringList[3]);
      this.discard4ValueMapList = JSON.parse(discardValueMapListStringList[4]);
      this.discard5ValueMapList = JSON.parse(discardValueMapListStringList[5]);
      console.log("Selector init done with successful file load");
      return;
    } catch (err) {
      if (err.code === 'ENOENT') {
        console.log("File not found");
      } else {
        console.log(err);
        console.log("Failed to load file-saved discard value table");
      }
    }

    this.discard0ValueList = [];
    for (let i = 0; i < _52C5; ++i) {
      this.discard0ValueList.push(null);
    }
    this.discard1ValueMapList = [];
    for (let i = 0; i < _52C4; ++i) {
      this.discard1ValueMapList.push({ case_count: _48C1, result: {} });
    }
    this.discard2ValueMapList = [];
    for (let i = 0; i < _52C3; ++i) {
      this.discard2ValueMapList.push({ case_count: _49C2, result: {} });
    }
    this.discard3ValueMapList = [];
    for (let i = 0; i < _52C2; ++i) {
      this.discard3ValueMapList.push({ case_count: _50C3, result: {} });
    }
    this.discard4ValueMapList = [];
    for (let i = 0; i < _52C1; ++i) {
      this.discard4ValueMapList.push({ case_count: _51C4, result: {} });
    }
    this.discard5ValueMapList = [];
    for (let i = 0; i < _52C0; ++i) {
      this.discard5ValueMapList.push({ case_count: _52C5, result: {} });
    }

    const deck = new Deck();
    const allCardList: TCard[] = deck.card_list;
    const allPossibleHandList: TCard[][] = [];
    for (let i1 = 0; i1 < allCardList.length - 4; ++i1) {
      for (let i2 = i1 + 1; i2 < allCardList.length - 3; ++i2) {
        for (let i3 = i2 + 1; i3 < allCardList.length - 2; ++i3) {
          for (let i4 = i3 + 1; i4 < allCardList.length - 1; ++i4) {
            for (let i5 = i4 + 1; i5 < allCardList.length; ++i5) {
              allPossibleHandList.push([
                allCardList[i1],
                allCardList[i2],
                allCardList[i3],
                allCardList[i4],
                allCardList[i5],
              ]);
            }
          }
        }
      }
    }
    console.log("Creating optimal selection shortcut table");
    const progressUnit = Math.floor(allPossibleHandList.length / 1000);
    for (let i = 0; i < allPossibleHandList.length; ++i) {
      if (i % progressUnit === 0) {
        process.stdout.write(`${(i / allPossibleHandList.length * 100).toFixed(1)}%\r`);
      }
      const hand = allPossibleHandList[i];
      const handPayTitle = this.pay_calculator.calculateHandResult(hand).pay_title;
      if (handPayTitle) {
        for (const possibleHandAfterDiscard of subsets(hand)) {
          const handIndex = cardListToIndex(possibleHandAfterDiscard);
          switch (possibleHandAfterDiscard.length) {
            case 0:
              if (this.discard5ValueMapList[handIndex].result[handPayTitle] === undefined) {
                this.discard5ValueMapList[handIndex].result[handPayTitle] = 0;
              }
              this.discard5ValueMapList[handIndex].result[handPayTitle]++;
              break;
            case 1:
              if (this.discard4ValueMapList[handIndex].result[handPayTitle] === undefined) {
                this.discard4ValueMapList[handIndex].result[handPayTitle] = 0;
              }
              this.discard4ValueMapList[handIndex].result[handPayTitle]++;
              break;
            case 2:
              if (this.discard3ValueMapList[handIndex].result[handPayTitle] === undefined) {
                this.discard3ValueMapList[handIndex].result[handPayTitle] = 0;
              }
              this.discard3ValueMapList[handIndex].result[handPayTitle]++;
              break;
            case 3:
              if (this.discard2ValueMapList[handIndex].result[handPayTitle] === undefined) {
                this.discard2ValueMapList[handIndex].result[handPayTitle] = 0;
              }
              this.discard2ValueMapList[handIndex].result[handPayTitle]++;
              break;
            case 4:
              if (this.discard1ValueMapList[handIndex].result[handPayTitle] === undefined) {
                this.discard1ValueMapList[handIndex].result[handPayTitle] = 0;
              }
              this.discard1ValueMapList[handIndex].result[handPayTitle]++;
              break;
            case 5:
              this.discard0ValueList[handIndex] = handPayTitle;
              break;
            default:
              throw new Error('Invalid hand size');
          }
        }
      }
    }
    console.log("Writing calculated discard value table to file");
    try {
      fs.writeFileSync(fileCacheName, JSON.stringify(this.discard0ValueList) + '\n');
      fs.appendFileSync(fileCacheName, JSON.stringify(this.discard1ValueMapList) + '\n');
      fs.appendFileSync(fileCacheName, JSON.stringify(this.discard2ValueMapList) + '\n');
      fs.appendFileSync(fileCacheName, JSON.stringify(this.discard3ValueMapList) + '\n');
      fs.appendFileSync(fileCacheName, JSON.stringify(this.discard4ValueMapList) + '\n');
      fs.appendFileSync(fileCacheName, JSON.stringify(this.discard5ValueMapList) + '\n');
      console.log("Successful disacrd value table file save");
    } catch (err) {
      console.log("Failed to save discard value table in file");
    }
    console.log("Selector init done");
  }

  private getExpectedOutcomeFromDiscardValueArray(holdingCardList: TCard[]): Readonly<{ case_count: number; result: Readonly<IPayTitleMap<number>> }> {
    const handIndex = cardListToIndex(holdingCardList);
    switch (holdingCardList.length) {
      case 0:
        return this.discard5ValueMapList[handIndex];
      case 1:
        return this.discard4ValueMapList[handIndex];
      case 2:
        return this.discard3ValueMapList[handIndex];
      case 3:
        return this.discard2ValueMapList[handIndex];
      case 4:
        return this.discard1ValueMapList[handIndex];
      case 5:
        const retValue: IExpectedOutcome = {
          case_count: _47C0,
          result: {},
        };
        const payTitle = this.discard0ValueList[handIndex];
        if (payTitle) {
          retValue.result[payTitle] = _47C0;
        }
        return retValue;
      default:
        throw new Error(`Invalid card list length: ${holdingCardList.length}\n${JSON.stringify(holdingCardList)}`);
    }
  }

  getPossibleOutcomeOfHoldingCards(origCardList: TCard[], holdingCardList: TCard[]): IExpectedOutcome {
    /* \binom{m}{n} = \sum_{k=0}^{n} (-1)^k \binom{n}{k} \binom{m+n-k}{n-k} */
    // for this case, m = 47, n = discarded card amount, which means hand result should have case_count of combination(47, discardedCardAmount)
    // WARNING: formula above & this logic is not proved yet!
    const expectedOutcome = this.getExpectedOutcomeFromDiscardValueArray(holdingCardList);
    const expectedOutcomeWithDiscard: IExpectedOutcome = { case_count: expectedOutcome.case_count, result: Object.assign({}, expectedOutcome.result) };
    const discardedCardList = origCardList.filter(function (card) {
      return holdingCardList.indexOf(card) === -1;
    });
    for (const discardedCardListSubset of subsetsWithoutEmpty(discardedCardList)) {
      const impossibleHand = holdingCardList.concat(discardedCardListSubset);
      const impossibleHandResult = this.getExpectedOutcomeFromDiscardValueArray(impossibleHand);
      if (discardedCardListSubset.length % 2) {
        mergeBySubtract(expectedOutcomeWithDiscard, impossibleHandResult);
      } else {
        mergeByAdd(expectedOutcomeWithDiscard, impossibleHandResult);
      }
    }
    return expectedOutcomeWithDiscard;
  }

  getPossibleOutcomeOfHoldingCardsWithoutDiscard(holdingCardList: TCard[]): IExpectedOutcome {
    const expectedOutcome = this.getExpectedOutcomeFromDiscardValueArray(holdingCardList);
    const expectedOutcomeCopy: IExpectedOutcome = { case_count: expectedOutcome.case_count, result: Object.assign({}, expectedOutcome.result) };
    return expectedOutcomeCopy;
  }

  getExpectedValueWithPossibleHoldingHandList(cardList: TCard[]): { hand: TCard[], expected_value: number, outcome: IExpectedOutcome }[] {
    const expectedValueWithPossibleHoldingHandList: { hand: TCard[], expected_value: number, outcome: IExpectedOutcome }[] = [];
    for (const possibleHandAfterDiscard of subsets(cardList)) {
      const possibleOutcomeMap = this.getPossibleOutcomeOfHoldingCards(cardList, possibleHandAfterDiscard);
      let totalSumValue = 0;
      for (const key in possibleOutcomeMap.result) {
        totalSumValue += this.pay_calculator.pay_table[key] * possibleOutcomeMap.result[key];
      }
      const expectedValue = totalSumValue / possibleOutcomeMap.case_count;
      expectedValueWithPossibleHoldingHandList.push({
        hand: possibleHandAfterDiscard,
        expected_value: expectedValue,
        outcome: possibleOutcomeMap,
      });
    }
    return expectedValueWithPossibleHoldingHandList;
  }

  getExpectedValueWithPossibleHoldingHandListNotConsideringDiscard(cardList: TCard[]): { hand: TCard[], expected_value: number, outcome: IExpectedOutcome }[] {
    const expectedValueWithPossibleHoldingHandList: { hand: TCard[], expected_value: number, outcome: IExpectedOutcome }[] = [];
    for (const possibleHandAfterDiscard of subsets(cardList)) {
      const possibleOutcomeMap = this.getPossibleOutcomeOfHoldingCardsWithoutDiscard(possibleHandAfterDiscard);
      let totalSumValue = 0;
      for (const key in possibleOutcomeMap.result) {
        totalSumValue += this.pay_calculator.pay_table[key] * possibleOutcomeMap.result[key];
      }
      const expectedValue = totalSumValue / possibleOutcomeMap.case_count;
      expectedValueWithPossibleHoldingHandList.push({
        hand: possibleHandAfterDiscard,
        expected_value: expectedValue,
        outcome: possibleOutcomeMap,
      });
    }
    return expectedValueWithPossibleHoldingHandList;
  }

  selectHoldTargetIndices(cardList: TCard[]): number[] {
    const expectedValueWithPossibleHoldingHandList = this.getExpectedValueWithPossibleHoldingHandList(cardList);
    const highestExpectedValueWithHand: { hand: TCard[], expected_value: number } = expectedValueWithPossibleHoldingHandList.reduce(function (acc, cur) {
      if (acc.expected_value < cur.expected_value) {
        return cur;
      } else {
        return acc;
      }
    });
    const highestExpectedValueHoldTargetIndexList: number[] = highestExpectedValueWithHand.hand.map(function (card) {
      return cardList.indexOf(card);
    });
    return highestExpectedValueHoldTargetIndexList;
  }
}

export class CheatedOptimalHoldTargetSelector implements IHoldTargetSelector {
  game: CheatedPokerGame;
  constructor(cheatedGame: CheatedPokerGame) {
    this.game = cheatedGame;
  }

  getExpectedValueForEachPossibleHoldingHandList(cardList: TCard[]): { hand: TCard[], expected_value: number }[] {
    const expectedValueWithPossibleHoldingHandList: { hand: TCard[], expected_value: number }[] = [];
    for (const possibleHandAfterDiscard of subsets(cardList)) {
      const newCardList = this.game.next_card_list.slice(0, cardList.length - possibleHandAfterDiscard.length);
      const newHand = possibleHandAfterDiscard.concat(newCardList);
      const handResult = this.game.pay_calculator.calculateHandResult(newHand);
      const expectedValue = handResult.pay;
      expectedValueWithPossibleHoldingHandList.push({
        hand: possibleHandAfterDiscard,
        expected_value: expectedValue,
      });
    }
    return expectedValueWithPossibleHoldingHandList;
  }

  selectHoldTargetIndices(): number[] {
    const cardList = this.game.main_hand;
    const expectedValueWithPossibleHoldingHandList = this.getExpectedValueForEachPossibleHoldingHandList(cardList);
    const highestExpectedValueWithHand: { hand: TCard[], expected_value: number } = expectedValueWithPossibleHoldingHandList.reduce(function (acc, cur) {
      if (acc.expected_value < cur.expected_value) {
        return cur;
      } else {
        return acc;
      }
    });
    const highestExpectedValueHoldTargetIndexList: number[] = highestExpectedValueWithHand.hand.map(function (card) {
      return cardList.indexOf(card);
    });
    return highestExpectedValueHoldTargetIndexList;
  }
}
