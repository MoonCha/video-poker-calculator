export enum Suit {
  Heart = '0',
  Diamond = '1',
  Spade = '2',
  Clover = '3',
}
  
export type TRank = '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | '11' | '12' | '13';
  
export interface ICard {
  readonly suit: Suit;
  readonly rank: TRank;
}
  
export type TCard = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23 | 24 | 25 | 26 | 27 | 28 | 29 | 30 | 31 | 32 | 33 | 34 | 35 | 36 | 37 | 38 | 39 | 40 | 41 | 42 | 43 | 44 | 45 | 46 | 47 | 48 | 49 | 50 | 51;

export interface IDeck {
  draw: () => TCard | undefined;
  shuffle: () => void;
}

export interface IPayTitleMap<T> {
  // JacksOrBetter
  ROYAL_STRAIGHT_FLUSH?: T;
  STRAIGHT_FLUSH?: T;
  FOUR_OF_A_KIND?: T;
  FULL_HOUSE?: T;
  FLUSH?: T;
  STRAIGHT?: T;
  THREE_OF_A_KIND?: T;
  TWO_PAIR?: T;
  JACKS_OR_BETTER?: T;

  // DoubleBonus
  FOUR_ACES_WITH_234?: T;
  FOUR_234S_WITH_A234?: T;
  FOUR_OF_A_KIND_ACE?: T;
  FOUR_OF_A_KIND_234?: T;
  FOUR_OF_A_KIND_5_THRU_KING?: T;

  // DeucesWildBonus
  FOUR_DEUCES?: T;
  WILD_ROYAL_STRAIGHT_FLUSH?: T;
  FIVE_OF_A_KIND?: T;
  WILD_STRAIGHT_FLUSH?: T;
  WILD_FOUR_OF_A_KIND?: T;
  WILD_FULL_HOUSE?: T;
  WILD_FLUSH?: T;
  WILD_STRAIGHT?: T;
  WILD_THREE_OF_A_KIND?: T;
}

export interface IJudgeFunc {
  (cardList: TCard[], cardsBySuit: { [value in Suit]: TCard[] }, cardsByRank: { [value in TRank]: TCard[] }): boolean;
}

export interface IHandResult {
  pay_title: keyof IPayTitleMap<any> | null;
  pay: number;
}

export interface IPayCalculator {
  pay_table: Readonly<IPayTitleMap<number>>;
  judge_func_map: IPayTitleMap<IJudgeFunc>;
  judge_func_with_pay_title_array: { pay_title: keyof IPayTitleMap<number>, judge_func: IJudgeFunc }[];
  calculateHandResult: (cardList: TCard[]) => IHandResult;
}

export interface IPokerGame {
  pay_calculator: IPayCalculator;
  main_deck: IDeck;
  main_hand: TCard[];
  sub_hand_list: TCard[][];

  newGame: () => void;
  discardAndDrawCards: (holdTargetIndexList: number[], subdeckAmount: number) => void;
  getGameResult: () => { main_hand_result: IHandResult, sub_hand_result_list: IHandResult[] };
}
