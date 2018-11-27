import {
  TCard,
  IPayTitleMap,
} from '../video-poker/types';

export interface IExpectedOutcome {
  case_count: number;
  result: IPayTitleMap<number>;
}

export interface IHoldTargetSelector {
  selectHoldTargetIndices: (cardList: TCard[]) => number[];
}

export interface IOptimalHoldTargetSelector extends IHoldTargetSelector {
  getPossibleOutcomeOfHoldingCards(origCardList: TCard[], holdingCardList: TCard[]): { case_count: number; result: IPayTitleMap<number> };
  getPossibleOutcomeOfHoldingCardsWithoutDiscard(holdingCardList: TCard[]): { case_count: number; result: IPayTitleMap<number> };
  getExpectedValueWithPossibleHoldingHandList(cardList: TCard[]): { hand: TCard[], expected_value: number, outcome: IExpectedOutcome }[];
  getExpectedValueWithPossibleHoldingHandListNotConsideringDiscard(cardList: TCard[]): { hand: TCard[], expected_value: number, outcome: IExpectedOutcome }[];
  selectHoldTargetIndicesNotConsideringDiscard?: (cardList: TCard[], subdeckAmount: number) => number[];
}
