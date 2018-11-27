import {
  TCard,
  IPayTitleMap,
  IJudgeFunc,
  IHandResult,
  IPayCalculator,
  IPokerGame,
} from './types';
import Deck from './deck';
import PayCalculator from './pay-calculator';

export class BasicPokerGame implements IPokerGame {
  pay_calculator: IPayCalculator;
  main_deck: Deck;
  main_hand: TCard[];
  sub_hand_list: TCard[][];

  constructor(payTable: IPayTitleMap<number>, payTitleToJudgeFuncMap: IPayTitleMap<IJudgeFunc>) {
    this.pay_calculator = new PayCalculator(payTable, payTitleToJudgeFuncMap);
  }

  newGame() {
    this.main_deck = new Deck();
    this.main_hand = this.main_deck.drawRandomMultiple(5);
    this.sub_hand_list = [];
  }

  discardAndDrawCards(holdTargetIndexList: number[], subdeckAmount: number = 0) {
    const mainHandAfterDiscard: TCard[] = [];
    for (let i = 0; i < holdTargetIndexList.length; ++i) {
      const holdTargetIndex = holdTargetIndexList[i];
      mainHandAfterDiscard.push(this.main_hand[holdTargetIndex]);
    }
    const newMainDeckCards: TCard[] = this.main_deck.drawRandomMultiple(5 - holdTargetIndexList.length);
    this.main_hand = mainHandAfterDiscard.concat(newMainDeckCards);

    // TODO: make it faster
    for (let i = 0; i < subdeckAmount; ++i) {
      const subDeck = new Deck();
      subDeck.filterOut(mainHandAfterDiscard);
      const newSubdeckCards = subDeck.drawRandomMultiple(5 - mainHandAfterDiscard.length);
      this.sub_hand_list.push(mainHandAfterDiscard.concat(newSubdeckCards));
    }
  }

  getGameResult() {
    const mainHandResult = this.pay_calculator.calculateHandResult(this.main_hand);
    const subHandResultList: IHandResult[] = this.sub_hand_list.map(this.pay_calculator.calculateHandResult.bind(this.pay_calculator));
    return {
      main_hand_result: mainHandResult,
      sub_hand_result_list: subHandResultList,
    };
  }
}

export class UltimateXPokerGame extends BasicPokerGame {
  pay_multiplier_table: IPayTitleMap<number>;
  main_prev_hand_result: IHandResult;
  sub_prev_hand_result_list: IHandResult[];

  constructor(payTable: IPayTitleMap<number>, payTitleToJudgeFuncMap: IPayTitleMap<IJudgeFunc>, payMultiplierTable: IPayTitleMap<number>) {
    super(payTable, payTitleToJudgeFuncMap);
    this.pay_multiplier_table = payMultiplierTable;
    this.main_prev_hand_result = {
      pay_title: null,
      pay: 0,
    };
  }

  getGameResult() {
    const mainHandResult = this.pay_calculator.calculateHandResult(this.main_hand);
    if (this.main_prev_hand_result.pay_title) {
      mainHandResult.pay *= this.pay_multiplier_table[this.main_prev_hand_result.pay_title];
    }
    this.main_prev_hand_result = mainHandResult;
    const subHandResultList = this.sub_hand_list.map(subHand => this.pay_calculator.calculateHandResult(subHand));
    const subPrevHandResultList = [];
    for (let i = 0; i < subHandResultList.length; ++i) {
      const subHandResult = subHandResultList[i];
      const subPrevHandResult = this.sub_prev_hand_result_list[i];
      if (subPrevHandResult && subPrevHandResult.pay_title) {
        subHandResult.pay *= this.pay_multiplier_table[subPrevHandResult.pay_title];
      }
      subPrevHandResultList.push(subHandResult);
    }
    this.sub_prev_hand_result_list = subPrevHandResultList;
    return {
      main_hand_result: mainHandResult,
      sub_hand_result_list: subHandResultList,
    };
  }
}

export class CheatedPokerGame implements IPokerGame {
  pay_calculator: PayCalculator;
  main_deck: Deck;
  main_hand: TCard[];
  sub_hand_list: TCard[][];
  next_card_list: TCard[];

  constructor(payTable: IPayTitleMap<number>, payTitleToJudgeFuncMap: IPayTitleMap<IJudgeFunc>) {
    this.pay_calculator = new PayCalculator(payTable, payTitleToJudgeFuncMap);
    this.sub_hand_list = [];
  }

  newGame() {
    this.main_deck = new Deck();
    this.main_hand = this.main_deck.drawRandomMultiple(5);
    this.next_card_list = this.main_deck.drawRandomMultiple(5);
  }

  // subdeckAmount is fixed to 0, because playing with subdeck always produces less-optimal result than playing only with maindeck.
  discardAndDrawCards(holdTargetIndexList: number[]) {
    const mainHandAfterDiscard: TCard[] = [];
    for (let i = 0; i < holdTargetIndexList.length; ++i) {
      const holdTargetIndex = holdTargetIndexList[i];
      mainHandAfterDiscard.push(this.main_hand[holdTargetIndex]);
    }
    const newMainDeckCards: TCard[] = this.next_card_list.splice(0, 5 - holdTargetIndexList.length);
    this.main_hand = mainHandAfterDiscard.concat(newMainDeckCards);
  }

  getGameResult() {
    const mainHandResult = this.pay_calculator.calculateHandResult(this.main_hand);
    return {
      main_hand_result: mainHandResult,
      sub_hand_result_list: [],
    };
  }
}
