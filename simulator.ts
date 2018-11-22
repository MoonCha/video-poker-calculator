/* tslint:disable:no-console */
import * as cluster from 'cluster';
import * as os from 'os';
import * as fs from 'fs';
import * as crypto from 'crypto';

/* Card */
enum Suit {
  Heart = '0',
  Diamond = '1',
  Spade = '2',
  Clover = '3',
}

type TRank = '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | '11' | '12' | '13';

// interface ICard {
//   readonly suit: Suit;
//   readonly rank: TRank;
// }

type TCard = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23 | 24 | 25 | 26 | 27 | 28 | 29 | 30 | 31 | 32 | 33 | 34 | 35 | 36 | 37 | 38 | 39 | 40 | 41 | 42 | 43 | 44 | 45 | 46 | 47 | 48 | 49 | 50 | 51;

// function convertObjectToCard(card: ICard): TCard {
//   return Number(card.suit) * 13 + Number(card.rank) - 1 as TCard;
// }

// function convertCardToObject(card: TCard): ICard {
//   let calculatedSuit: Suit;
//   switch (Math.floor(card / 13)) {
//     case 0:
//       calculatedSuit = Suit.Heart;
//       break;
//     case 1:
//       calculatedSuit = Suit.Diamond;
//       break;
//     case 2:
//       calculatedSuit = Suit.Spade;
//       break;
//     case 3:
//       calculatedSuit = Suit.Clover;
//       break;
//     default:
//       throw new Error(`Invalid card number: ${card}`);
//   }
//   const calculatedRank = (card % 13 + 1).toString() as TRank;
//   return { suit: calculatedSuit, rank: calculatedRank };
// }

/* Deck */
interface IDeck {
  draw: () => TCard;
  shuffle: () => void;
}

class Deck implements IDeck {
  card_list: TCard[];

  constructor() {
    this.card_list = Array.from(Array(52).keys()) as TCard[];
  }

  draw() {
    return this.card_list.shift();
  }

  drawMultiple(num: number) {
    return this.card_list.splice(0, num);
  }

  drawRandom() {
    const randomIndex = Math.floor(Math.random() * this.card_list.length);
    return this.card_list.splice(randomIndex, 1)[0];
  }

  drawRandomMultiple(num: number) {
    const cardList: TCard[] = [];
    for (let i = 0; i < num; ++i) {
      const card = this.drawRandom();
      cardList.push(card);
    }
    return cardList;
  }

  shuffle() {
    const arr = this.card_list;
    for (let j, x, i = arr.length; i; j = Math.floor(Math.random() * i), x = arr[--i], arr[i] = arr[j], arr[j] = x);
  }

  filterOut(removeTargetCardList: TCard[]) {
    this.card_list = this.card_list.filter(function (targetCard) {
      let isTarget = false;
      for (let i = 0; i < removeTargetCardList.length; ++i) {
        const removeTargetCard = removeTargetCardList[i];
        if (targetCard === removeTargetCard) {
          isTarget = true;
          break;
        }
      }
      return !isTarget;
    });
  }
}

/* Pay Calculator */
function classifyCardsBySuit(cardList: TCard[]): { [value in Suit]: TCard[] } {
  const classifiedMap = {
    0: [] as TCard[],
    1: [] as TCard[],
    2: [] as TCard[],
    3: [] as TCard[],
  };
  for (let i = 0; i < cardList.length; ++i) {
    const card = cardList[i];
    classifiedMap[Math.floor(card / 13)].push(card);
  }
  return classifiedMap;
}

function classifyCardsByRank(cardList: TCard[]): { [value in TRank]: TCard[] } {
  const classifiedMap = {
    1: [] as TCard[],
    2: [] as TCard[],
    3: [] as TCard[],
    4: [] as TCard[],
    5: [] as TCard[],
    6: [] as TCard[],
    7: [] as TCard[],
    8: [] as TCard[],
    9: [] as TCard[],
    10: [] as TCard[],
    11: [] as TCard[],
    12: [] as TCard[],
    13: [] as TCard[],
  };
  for (let i = 0; i < cardList.length; ++i) {
    const card = cardList[i];
    classifiedMap[card % 13 + 1].push(card);
  }

  return classifiedMap;
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

interface IJudgeFunc {
  (cardList: TCard[], cardsBySuit: { [value in Suit]: TCard[] }, cardsByRank: { [value in TRank]: TCard[] }): boolean;
}

export const allPayTitleToJudgeFuncMap: IPayTitleMap<IJudgeFunc> = {
  // JacksOrBetter
  ROYAL_STRAIGHT_FLUSH: isRoyalStraightFlush,
  STRAIGHT_FLUSH: isStraightFlush,
  FOUR_OF_A_KIND: isFourOfAKind,
  FULL_HOUSE: isFullHouse,
  FLUSH: isFlush,
  STRAIGHT: isStraight,
  THREE_OF_A_KIND: isThreeOfAKind,
  TWO_PAIR: isTwoPair,
  JACKS_OR_BETTER: isJacksOrBetter,

  // DoubleBonus
  FOUR_ACES_WITH_234: isFourAcesWith234,
  FOUR_234S_WITH_A234: isFour234sWithA234,
  FOUR_OF_A_KIND_ACE: isFourOfAKindAce,
  FOUR_OF_A_KIND_234: isFourOfAKind234,
  FOUR_OF_A_KIND_5_THRU_KING: isFourOfAKind5ThruKing,

  // DeucesWildBonus
  FOUR_DEUCES: isFourDeuces,
  WILD_ROYAL_STRAIGHT_FLUSH: isWildRoyalStraightFlush,
  FIVE_OF_A_KIND: isFiveOfAKind,
  WILD_STRAIGHT_FLUSH: isWildStraightFlush,
  WILD_FOUR_OF_A_KIND: isWildFourOfAKind,
  WILD_FULL_HOUSE: isWildFullHouse,
  WILD_FLUSH: isWildFlush,
  WILD_STRAIGHT: isWildStraight,
  WILD_THREE_OF_A_KIND: isWildThreeOfAKind,
};

// const jacksOrBetterPayTable: IPayTitleMap<number> = {
//   ROYAL_STRAIGHT_FLUSH: 250,
//   STRAIGHT_FLUSH: 50,
//   FOUR_OF_A_KIND: 25,
//   FULL_HOUSE: 9,
//   FLUSH: 6,
//   STRAIGHT: 4,
//   THREE_OF_A_KIND: 3,
//   TWO_PAIR: 2,
//   JACKS_OR_BETTER: 1,
// };

// const doubleDoubleBonusPayTable: IPayTitleMap<number> = {
//   ROYAL_STRAIGHT_FLUSH: 250,
//   FOUR_ACES_WITH_234: 400,
//   FOUR_234S_WITH_A234: 160,
//   FOUR_OF_A_KIND_ACE: 160,
//   FOUR_OF_A_KIND_234: 80,
//   FOUR_OF_A_KIND_5_THRU_KING: 50,
//   STRAIGHT_FLUSH: 50,
//   FULL_HOUSE: 9,
//   FLUSH: 6,
//   STRAIGHT: 4,
//   THREE_OF_A_KIND: 3,
//   TWO_PAIR: 1,
//   JACKS_OR_BETTER: 1,
// };

// const deucesWildBonusPayTable: IPayTitleMap<number> = {
//   ROYAL_STRAIGHT_FLUSH: 350,
//   FOUR_DEUCES: 200,
//   WILD_ROYAL_STRAIGHT_FLUSH: 25,
//   FIVE_OF_A_KIND: 16,
//   WILD_STRAIGHT_FLUSH: 10,
//   WILD_FOUR_OF_A_KIND: 4,
//   WILD_FULL_HOUSE: 4,
//   WILD_FLUSH: 3,
//   WILD_STRAIGHT: 2,
//   WILD_THREE_OF_A_KIND: 1,
// };

interface IHandResult {
  pay_title: keyof IPayTitleMap<any> | null;
  pay: number;
}

interface IPayCalculator {
  pay_table: Readonly<IPayTitleMap<number>>;
  judge_func_map: IPayTitleMap<IJudgeFunc>;
  judge_func_with_pay_title_array: { pay_title: keyof IPayTitleMap<number>, judge_func: IJudgeFunc }[];
  calculateHandResult: (cardList: TCard[]) => IHandResult;
}

class PayCalculator implements IPayCalculator {
  pay_table: Readonly<IPayTitleMap<number>>;
  judge_func_map: IPayTitleMap<IJudgeFunc>;
  judge_func_with_pay_title_array: { pay_title: keyof IPayTitleMap<number>, judge_func: IJudgeFunc }[];

  constructor(payTable: IPayTitleMap<number>, payTitleToJudgeFuncMap: IPayTitleMap<IJudgeFunc>) {
    this.pay_table = payTable;
    const judgeFuncMap: IPayTitleMap<IJudgeFunc> = {};
    this.judge_func_with_pay_title_array = [];
    // use getOwnPropertyNames to guarantee string property to be ordered by its creation order
    // Note: property should be ordered by priority (higher first)
    // e.g.) JAKCS_OR_BETTER should located after FULL_HOUSE.
    // If not, FULL_HOUSE hand can be payed as if it is JACKS_OR_BETTER
    const payTitleList = Object.getOwnPropertyNames(this.pay_table) as (keyof IPayTitleMap<number>)[];
    for (let i = 0; i < payTitleList.length; ++i) {
      const payTitle = payTitleList[i];
      if (payTitleToJudgeFuncMap[payTitle] == null) {
        throw new Error(`Paytitle(${payTitle}) does not exist in payTitleToJudgeFuncMap`);
      }
      judgeFuncMap[payTitle] = payTitleToJudgeFuncMap[payTitle];
      this.judge_func_with_pay_title_array.push({
        pay_title: payTitle,
        judge_func: payTitleToJudgeFuncMap[payTitle],
      });
    }
    this.judge_func_map = judgeFuncMap;
  }

  calculateHandResult(cardList: TCard[]) {
    const cardsBySuit = classifyCardsBySuit(cardList);
    const cardsByRank = classifyCardsByRank(cardList);
    if (this.judge_func_with_pay_title_array) {
      let firstApplicablePayTitle: keyof IPayTitleMap<number> = null;
      for (let i = 0; i < this.judge_func_with_pay_title_array.length; ++i) {
        const judgeFuncWithPayTitle = this.judge_func_with_pay_title_array[i];
        if (judgeFuncWithPayTitle.judge_func(cardList, cardsBySuit, cardsByRank)) {
          firstApplicablePayTitle = judgeFuncWithPayTitle.pay_title;
          break;
        }
      }
      const retValue: IHandResult = {
        pay_title: firstApplicablePayTitle,
        pay: firstApplicablePayTitle ? this.pay_table[firstApplicablePayTitle] : 0,
      };
      return retValue;
    } else {
      const applicablePayTitleList: (keyof IPayTitleMap<number>)[] = [];
      let key: keyof IPayTitleMap<number>;
      for (key in this.pay_table) {
        if (this.judge_func_map[key](cardList, cardsBySuit, cardsByRank)) {
          applicablePayTitleList.push(key);
        }
      }
      const payTitleWithHighestMultiplier = applicablePayTitleList.length > 0 ? applicablePayTitleList.reduce(function (acc, cur) {
        const accMultiplier = this.pay_table[acc];
        const curMultiplier = this.pay_table[cur];
        if (accMultiplier < curMultiplier) {
          return cur;
        } else {
          return acc;
        }
      }.bind(this)) : null;

      const retValue: IHandResult = {
        pay_title: payTitleWithHighestMultiplier,
        pay: payTitleWithHighestMultiplier ? this.pay_table[payTitleWithHighestMultiplier] : 0,
      };
      return retValue;
    }
  }
}

function isRoyalStraightFlush(cardList: TCard[], cardsBySuit: { [value in Suit]: TCard[] }, cardsByRank: { [value in TRank]: TCard[] }): boolean {
  let allSuitSame = false;
  for (const key in Suit) {
    const suit = Suit[key];
    if (cardsBySuit[suit].length === 5) {
      allSuitSame = true;
      break;
    }
  }
  if (!allSuitSame) return false;

  let consistOf10JQKA = false;
  if (cardsByRank[10].length === 1 &&
    cardsByRank[11].length === 1 &&
    cardsByRank[12].length === 1 &&
    cardsByRank[13].length === 1 &&
    cardsByRank[1].length === 1) {
    consistOf10JQKA = true;
  }
  if (!consistOf10JQKA) return false;

  return true;
}

function isStraightFlush(cardList: TCard[], cardsBySuit: { [value in Suit]: TCard[] }, cardsByRank: { [value in TRank]: TCard[] }): boolean {
  let allSuitSame = false;
  for (const key in Suit) {
    const suit = Suit[key];
    if (cardsBySuit[suit].length === 5) {
      allSuitSame = true;
      break;
    }
  }
  if (!allSuitSame) return false;

  let sequentialFiveRank = true; // WARNING: do not detect 10 J Q K A
  let firstCardRank;
  for (let rank = 1; rank <= 13; ++rank) {
    if (cardsByRank[rank].length >= 1) {
      firstCardRank = rank;
      break;
    }
  }
  for (let rank = firstCardRank; rank < firstCardRank + 4; ++rank) {
    const nextRank = 1 + rank % 13;
    if (cardsByRank[nextRank].length === 0) {
      sequentialFiveRank = false;
      break;
    }
  }
  if (cardsByRank[10].length === 1 &&
    cardsByRank[11].length === 1 &&
    cardsByRank[12].length === 1 &&
    cardsByRank[13].length === 1 &&
    cardsByRank[1].length === 1) {
    sequentialFiveRank = true;
  }
  if (!sequentialFiveRank) return false;

  return true;
}

function isFourOfAKind(cardList: TCard[], cardsBySuit: { [value in Suit]: TCard[] }, cardsByRank: { [value in TRank]: TCard[] }): boolean {
  let fourCardSame = false;
  for (let rank = 1; rank <= 13; ++rank) {
    if (cardsByRank[rank].length === 4) {
      fourCardSame = true;
      break;
    }
  }
  if (!fourCardSame) return false;
  return true;
}

function isFullHouse(cardList: TCard[], cardsBySuit: { [value in Suit]: TCard[] }, cardsByRank: { [value in TRank]: TCard[] }): boolean {
  let threeCardSame = false;
  for (let rank = 1; rank <= 13; ++rank) {
    if (cardsByRank[rank].length === 3) {
      threeCardSame = true;
      break;
    }
  }
  if (!threeCardSame) return false;

  let twoCardSame = false;
  for (let rank = 1; rank <= 13; ++rank) {
    if (cardsByRank[rank].length === 2) {
      twoCardSame = true;
      break;
    }
  }
  if (!twoCardSame) return false;
  return true;
}

function isFlush(cardList: TCard[], cardsBySuit: { [value in Suit]: TCard[] }, cardsByRank: { [value in TRank]: TCard[] }): boolean {
  let allSuitSame = false;
  for (const key in Suit) {
    const suit = Suit[key];
    if (cardsBySuit[suit].length === 5) {
      allSuitSame = true;
      break;
    }
  }
  if (!allSuitSame) return false;
  return true;
}

function isStraight(cardList: TCard[], cardsBySuit: { [value in Suit]: TCard[] }, cardsByRank: { [value in TRank]: TCard[] }): boolean {
  let sequentialFiveRank = true;
  let firstCardRank;
  for (let rank = 1; rank <= 13; ++rank) {
    if (cardsByRank[rank].length >= 1) {
      firstCardRank = rank;
      break;
    }
  }
  for (let rank = firstCardRank; rank < firstCardRank + 4; ++rank) {
    const nextRank = 1 + rank % 13;
    if (cardsByRank[nextRank].length !== 1) {
      sequentialFiveRank = false;
      break;
    }
  }
  if (cardsByRank[10].length === 1 &&
    cardsByRank[11].length === 1 &&
    cardsByRank[12].length === 1 &&
    cardsByRank[13].length === 1 &&
    cardsByRank[1].length === 1) {
    sequentialFiveRank = true;
  }
  if (!sequentialFiveRank) return false;
  return true;
}

function isThreeOfAKind(cardList: TCard[], cardsBySuit: { [value in Suit]: TCard[] }, cardsByRank: { [value in TRank]: TCard[] }): boolean {
  let threeCardSame = false;
  for (let i = 1; i <= 13; ++i) {
    if (cardsByRank[i].length === 3) {
      threeCardSame = true;
      break;
    }
  }
  if (!threeCardSame) return false;
  return true;
}

function isTwoPair(cardList: TCard[], cardsBySuit: { [value in Suit]: TCard[] }, cardsByRank: { [value in TRank]: TCard[] }): boolean {
  let twoCardSameCount = 0;
  for (let rank = 1; rank <= 13; ++rank) {
    if (cardsByRank[rank].length === 2) {
      twoCardSameCount += 1;
      if (twoCardSameCount >= 2) {
        break;
      }
    }
  }
  return twoCardSameCount === 2;
}

function isJacksOrBetter(cardList: TCard[], cardsBySuit: { [value in Suit]: TCard[] }, cardsByRank: { [value in TRank]: TCard[] }): boolean {
  let jacksOrBetter = false;
  if (cardsByRank[1].length === 2 ||
    cardsByRank[11].length === 2 ||
    cardsByRank[12].length === 2 ||
    cardsByRank[13].length === 2) {
    jacksOrBetter = true;
  }
  if (!jacksOrBetter) return false;
  return true;
}

function isFourAcesWith234(cardList: TCard[], cardsBySuit: { [value in Suit]: TCard[] }, cardsByRank: { [value in TRank]: TCard[] }): boolean {
  let fourAces = false;
  if (cardsByRank[1].length === 4) {
    fourAces = true;
  }
  if (!fourAces) return false;

  let with234 = false;
  if (cardsByRank[2].length === 1 || cardsByRank[3].length === 1 || cardsByRank[4].length === 1) {
    with234 = true;
  }
  if (!with234) return false;
  return true;
}

function isFour234sWithA234(cardList: TCard[], cardsBySuit: { [value in Suit]: TCard[] }, cardsByRank: { [value in TRank]: TCard[] }): boolean {
  let four234s = false;
  if (cardsByRank[2].length === 4 || cardsByRank[3].length === 4 || cardsByRank[4].length === 4) {
    four234s = true;
  }
  if (!four234s) return false;

  let withA234 = false;
  if (cardsByRank[1].length === 1 || cardsByRank[2].length === 1 || cardsByRank[3].length === 1 || cardsByRank[4].length === 1) {
    withA234 = true;
  }
  if (!withA234) return false;
  return true;
}

function isFourOfAKindAce(cardList: TCard[], cardsBySuit: { [value in Suit]: TCard[] }, cardsByRank: { [value in TRank]: TCard[] }): boolean {
  let fourOfAKindAce = false;
  if (cardsByRank[1].length === 4) {
    fourOfAKindAce = true;
  }
  if (!fourOfAKindAce) return false;
  return true;
}

function isFourOfAKind234(cardList: TCard[], cardsBySuit: { [value in Suit]: TCard[] }, cardsByRank: { [value in TRank]: TCard[] }): boolean {
  let fourOfAKind234 = false;
  if (cardsByRank[2].length === 4 || cardsByRank[3].length === 4 || cardsByRank[4].length === 4) {
    fourOfAKind234 = true;
  }
  if (!fourOfAKind234) return false;
  return true;
}

function isFourOfAKind5ThruKing(cardList: TCard[], cardsBySuit: { [value in Suit]: TCard[] }, cardsByRank: { [value in TRank]: TCard[] }): boolean {
  let fourOfAKind5ThruKing = false;
  for (let i = 5; i <= 13; ++i) {
    if (cardsByRank[i].length === 4) {
      fourOfAKind5ThruKing = true;
      break;
    }
  }
  if (!fourOfAKind5ThruKing) return false;
  return true;
}

function isFourDeuces(cardList: TCard[], cardsBySuit: { [value in Suit]: TCard[] }, cardsByRank: { [value in TRank]: TCard[] }): boolean {
  let four2 = false;
  if (cardsByRank[2].length === 4) {
    four2 = true;
  }
  if (!four2) return false;
  return true;
}

function isWildRoyalStraightFlush(cardList: TCard[], cardsBySuit: { [value in Suit]: TCard[] }, cardsByRank: { [value in TRank]: TCard[] }): boolean {
  const numOfWild = cardsByRank[2].length;

  let allSuitSame = false;
  const cardListWithout2 = cardList.filter(function (card) { return (card % 13 + 1) != 2; });
  const cardsBySuitWithout2 = classifyCardsBySuit(cardListWithout2);
  for (const key in Suit) {
    const suit = Suit[key];
    if (cardsBySuitWithout2[suit].length + numOfWild === 5) {
      allSuitSame = true;
      break;
    }
  }
  if (!allSuitSame) return false;

  let allCardsAmong10JQKA = false;
  if (cardsByRank[2].length + cardsByRank[10].length + cardsByRank[11].length + cardsByRank[12].length + cardsByRank[13].length + cardsByRank[1].length === 5) {
    allCardsAmong10JQKA = true;
  }
  if (!allCardsAmong10JQKA) return false;

  let consistOf10JQKA = false;
  if (cardsByRank[10].length <= 1 && cardsByRank[11].length <= 1 && cardsByRank[12].length <= 1 && cardsByRank[13].length <= 1 && cardsByRank[1].length <= 1) {
    consistOf10JQKA = true;
  }
  if (!consistOf10JQKA) return false;
  return true;
}

function isFiveOfAKind(cardList: TCard[], cardsBySuit: { [value in Suit]: TCard[] }, cardsByRank: { [value in TRank]: TCard[] }): boolean {
  const numOfWild = cardsByRank[2].length;

  let fiveOfAKind = false;
  for (const candidateRank in cardsByRank) {
    if (candidateRank === '2') {
      continue;
    }
    if (cardsByRank[candidateRank].length + numOfWild === 5) {
      fiveOfAKind = true;
      break;
    }
  }
  if (!fiveOfAKind) return false;
  return true;
}

function isWildStraightFlush(cardList: TCard[], cardsBySuit: { [value in Suit]: TCard[] }, cardsByRank: { [value in TRank]: TCard[] }): boolean {
  const numOfWild = cardsByRank[2].length;

  let allSuitSame = false;
  const cardListWithout2 = cardList.filter(function (card) { return (card % 13 + 1) != 2; });
  const cardsBySuitWithout2 = classifyCardsBySuit(cardListWithout2);
  for (const key in Suit) {
    const suit = Suit[key];
    if (cardsBySuitWithout2[suit].length + numOfWild === 5) {
      allSuitSame = true;
      break;
    }
  }
  if (!allSuitSame) return false;

  let sequentialFiveRank = true;
  let non2FirstCardRank;
  for (let i = 1; i <= 13; ++i) {
    if (i === 2) {
      continue;
    }
    if (cardsByRank[i].length >= 1) {
      non2FirstCardRank = i;
      break;
    }
  }
  if (cardsByRank[non2FirstCardRank].length !== 1) {
    return false;
  }
  let remainSkipChance = numOfWild;
  for (let rank = non2FirstCardRank; rank < non2FirstCardRank + 4; ++rank) {
    const nextRank = 1 + rank % 13;
    if (cardsByRank[nextRank].length !== 1) {
      if (remainSkipChance > 0) {
        remainSkipChance--;
        continue;
      } else {
        sequentialFiveRank = false;
        break;
      }
    }
    if (nextRank === 2) {
      remainSkipChance--;
    }
  }
  if (!sequentialFiveRank) {
    let allCardsAmong10JQKA = false;
    if (numOfWild + cardsByRank[10].length + cardsByRank[11].length + cardsByRank[12].length + cardsByRank[13].length + cardsByRank[1].length === 5) {
      allCardsAmong10JQKA = true;
    }
    if (!allCardsAmong10JQKA) return false;
    let consistOf10JQKA = false;
    if (cardsByRank[10].length <= 1 && cardsByRank[11].length <= 1 && cardsByRank[12].length <= 1 && cardsByRank[13].length <= 1 && cardsByRank[1].length <= 1) {
      consistOf10JQKA = true;
    }
    if (!consistOf10JQKA) return false;
    return true;
  }
  return true;
}

function isWildFourOfAKind(cardList: TCard[], cardsBySuit: { [value in Suit]: TCard[] }, cardsByRank: { [value in TRank]: TCard[] }): boolean {
  const numOfWild = cardsByRank[2].length;

  let fourOfAKind = false;
  for (let rank = 1; rank <= 13; ++rank) {
    if (rank === 2) {
      if (cardsByRank[rank].length === 4) {
        return true;
      }
      continue;
    }
    if (numOfWild + cardsByRank[rank].length >= 4) {
      fourOfAKind = true;
      break;
    }
  }
  if (!fourOfAKind) return false;
  return true;
}

function isWildFullHouse(cardList: TCard[], cardsBySuit: { [value in Suit]: TCard[] }, cardsByRank: { [value in TRank]: TCard[] }): boolean {
  const numOfWild = cardsByRank[2].length;
  let remainWildChance = numOfWild;
  const cardsByRankLengthDistributionWithout2 = {
    0: 0,
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };
  for (let rank = 1; rank <= 13; ++rank) {
    if (rank === 2) {
      continue;
    }
    cardsByRankLengthDistributionWithout2[cardsByRank[rank].length]++;
  }
  const firstTwoHighestLengthList = [0, 0];
  for (let i = 0; i < 2; ++i) {
    for (let targetSize = 5; targetSize >= 0; --targetSize) {
      if (cardsByRankLengthDistributionWithout2[targetSize] > 0) {
        cardsByRankLengthDistributionWithout2[targetSize]--;
        firstTwoHighestLengthList[i] = targetSize;
        break;
      }
    }
  }

  let threeCardSame = false;
  if (firstTwoHighestLengthList[0] + remainWildChance >= 3 && firstTwoHighestLengthList[0] < 4) {
    const usedWildChance = 3 - firstTwoHighestLengthList[0];
    if (usedWildChance > 0) {
      remainWildChance -= usedWildChance;
    }
    threeCardSame = true;
  }
  if (!threeCardSame) return false;

  let twoCardSame = false;
  if (firstTwoHighestLengthList[1] + remainWildChance >= 2 && firstTwoHighestLengthList[1] < 3) {
    const usedWildChance = 2 - firstTwoHighestLengthList[1];
    if (usedWildChance > 0) {
      remainWildChance -= usedWildChance;
    }
    twoCardSame = true;
  }
  if (!twoCardSame) return false;
  return true;
}

function isWildFlush(cardList: TCard[], cardsBySuit: { [value in Suit]: TCard[] }, cardsByRank: { [value in TRank]: TCard[] }): boolean {
  const numOfWild = cardsByRank[2].length;

  let allSuitSame = false;
  const cardListWithout2 = cardList.filter(function (card) { return (card % 13 + 1) != 2; });
  const cardsBySuitWithout2 = classifyCardsBySuit(cardListWithout2);
  for (const key in Suit) {
    const suit = Suit[key];
    if (cardsBySuitWithout2[suit].length + numOfWild === 5) {
      allSuitSame = true;
      break;
    }
  }
  if (!allSuitSame) return false;
  return true;
}

function isWildStraight(cardList: TCard[], cardsBySuit: { [value in Suit]: TCard[] }, cardsByRank: { [value in TRank]: TCard[] }): boolean {
  const numOfWild = cardsByRank[2].length;

  let sequentialFiveRank = true;
  let non2FirstCardRank;
  for (let rank = 1; rank <= 13; ++rank) {
    if (rank === 2) {
      continue;
    }
    if (cardsByRank[rank].length >= 1) {
      non2FirstCardRank = rank;
      break;
    }
  }
  if (cardsByRank[non2FirstCardRank].length !== 1) {
    return false;
  }
  let remainSkipChance = numOfWild;
  for (let rank = non2FirstCardRank; rank < non2FirstCardRank + 4; ++rank) {
    const nextRank = 1 + rank % 13;
    if (cardsByRank[nextRank].length !== 1) {
      if (remainSkipChance > 0) {
        remainSkipChance--;
        continue;
      } else {
        sequentialFiveRank = false;
        break;
      }
    }
    if (nextRank === 2) {
      remainSkipChance--;
    }
  }
  if (!sequentialFiveRank) {
    let allCardsAmong10JQKA = false;
    if (numOfWild + cardsByRank[10].length + cardsByRank[11].length + cardsByRank[12].length + cardsByRank[13].length + cardsByRank[1].length === 5) {
      allCardsAmong10JQKA = true;
    }
    if (!allCardsAmong10JQKA) return false;
    let consistOf10JQKA = false;
    if (cardsByRank[10].length <= 1 && cardsByRank[11].length <= 1 && cardsByRank[12].length <= 1 && cardsByRank[13].length <= 1 && cardsByRank[1].length <= 1) {
      consistOf10JQKA = true;
    }
    if (!consistOf10JQKA) return false;
    return true;
  }
  return true;
}

function isWildThreeOfAKind(cardList: TCard[], cardsBySuit: { [value in Suit]: TCard[] }, cardsByRank: { [value in TRank]: TCard[] }): boolean {
  const numOfWild = cardsByRank[2].length;

  let threeOfAKind = false;
  for (let rank = 1; rank <= 13; ++rank) {
    if (rank === 2) {
      continue;
    }
    if (numOfWild + cardsByRank[rank].length >= 3) {
      if (cardsByRank[rank].length < 4) {
        threeOfAKind = true;
        break;
      }
    }
  }
  if (!threeOfAKind) return false;
  return true;
}

/* Poker Game */
interface IPokerGame {
  pay_calculator: IPayCalculator;
  main_deck: Deck;
  main_hand: TCard[];
  sub_hand_list: TCard[][];

  newGame: () => void;
  discardAndDrawCards: (holdTargetIndexList: number[], subdeckAmount: number) => void;
  getGameResult: () => { main_hand_result: IHandResult, sub_hand_result_list: IHandResult[] };
}

export class BasicPokerGame implements IPokerGame {
  pay_calculator: PayCalculator;
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

/* Hold Selector */
interface IHoldTargetSelector {
  selectHoldTargetIndices: (cardList: TCard[]) => number[];
}

interface IOptimalHoldTargetSelector extends IHoldTargetSelector {
  getPossibleOutcomeOfHoldingCards(origCardList: TCard[], holdingCardList: TCard[]): { case_count: number; result: IPayTitleMap<number> };
  getPossibleOutcomeOfHoldingCardsWithoutDiscard(holdingCardList: TCard[]): { case_count: number; result: IPayTitleMap<number> };
  getExpectedValueWithPossibleHoldingHandList(cardList: TCard[]): { hand: TCard[], expected_value: number, outcome: IExpectedOutcome }[];
  getExpectedValueWithPossibleHoldingHandListNotConsideringDiscard(cardList: TCard[]): { hand: TCard[], expected_value: number, outcome: IExpectedOutcome }[];
  selectHoldTargetIndicesNotConsideringDiscard?: (cardList: TCard[], subdeckAmount: number) => number[];
}

// class HoldAllTargetSelector implements IHoldTargetSelector {
//   selectHoldTargetIndices(cardList: TCard[]) {
//     return [0, 1, 2, 3, 4];
//   }
// }

function* subsets<U>(list: U[], offset = 0): IterableIterator<U[]> {
  while (offset < list.length) {
    const first = list[offset++];
    for (const subset of subsets(list, offset)) {
      subset.push(first);
      yield subset;
    }
  }
  yield [];
}

function* subsetsWithoutEmpty<U>(list: U[], offset = 0): IterableIterator<U[]> {
  while (offset < list.length) {
    const first = list[offset++];
    for (const subset of subsets(list, offset)) {
      subset.push(first);
      yield subset;
    }
  }
}

function combination(n: number, r: number): number {
  let result = 1;
  for (let i = n; i > n - r; --i) {
    result *= i;
  }
  for (let i = 1; i <= r; ++i) {
    result /= i;
  }
  return result;
}

const combinArray: number[][] = [];
for (let i = 0; i <= 52; ++i) {
  const combinElement: number[] = [];
  for (let j = 0; j <= 5; ++j) {
    combinElement.push(combination(i, j));
  }
  combinArray.push(combinElement);
}

function cardListToIndex(cardList: TCard[]): number {
  const cardCount = cardList.length;
  if (cardCount > 0) {
    const sortedCardList = cardList.slice();
    sortedCardList.sort(function (a, b) { return a - b; });
    let cardIndex = combinArray[52][cardCount] - combinArray[52 - sortedCardList[0]][cardCount];
    for (let i = 1; i < cardCount; ++i) {
      cardIndex += combinArray[51 - sortedCardList[i - 1]][cardCount - i] - combinArray[52 - sortedCardList[i]][cardCount - i];
    }
    return cardIndex;
  } else {
    return 0;
  }
}

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

interface IExpectedOutcome {
  case_count: number;
  result: IPayTitleMap<number>;
}

function mergeByAdd(into: IExpectedOutcome, target: IExpectedOutcome): IExpectedOutcome {
  into.case_count += target.case_count;
  for (const key in target.result) {
    if (into.result[key] == null) {
      into.result[key] = 0;
    }
    into.result[key] += target.result[key];
  }
  return into;
}

function mergeBySubtract(into: IExpectedOutcome, target: IExpectedOutcome): IExpectedOutcome {
  into.case_count -= target.case_count;
  for (const key in target.result) {
    if (into.result[key] == null) {
      into.result[key] = 0;
    }
    into.result[key] -= target.result[key];
  }
  return into;
}

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
    hashGenerator.update(JSON.stringify(Object.getOwnPropertyNames(this.pay_calculator.pay_table)));
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

/* RTP Calculator */
interface IRTPCalculatorResult {
  hand_count: number;
  expected_value_sum: number;
  statistics: IExpectedOutcome;
}

interface IPayCalculatorEventSpec {
  progress: (processedCaseCount: number, targetCaseCount: number) => void;

  error: (err: Error) => void;

  done: (result: IRTPCalculatorResult) => void;

  doneParallel: (result: IRTPCalculatorResult) => void;
}

export class RTPCalculator<K extends IOptimalHoldTargetSelector> {
  pay_table: Readonly<IPayTitleMap<number>>;
  optimal_hold_target_selector: K;
  emit: IPayCalculatorEventSpec;

  constructor(payTable: IPayTitleMap<number>, optimalHoldTargetSelector: K) {
    this.pay_table = payTable;
    this.optimal_hold_target_selector = optimalHoldTargetSelector;

    this.emit = {
      progress: noop,
      error: noop,
      done: noop,
      doneParallel: noop,
    };
  }

  calculateRTP(partialPossibleHandList: TCard[][] = null) {
    let targetPossibleHandList: TCard[][];
    if (partialPossibleHandList == null) {
      targetPossibleHandList = [];
      const deck = new Deck();
      const allCardList: TCard[] = deck.card_list;
      for (let i1 = 0; i1 < allCardList.length - 4; ++i1) {
        for (let i2 = i1 + 1; i2 < allCardList.length - 3; ++i2) {
          for (let i3 = i2 + 1; i3 < allCardList.length - 2; ++i3) {
            for (let i4 = i3 + 1; i4 < allCardList.length - 1; ++i4) {
              for (let i5 = i4 + 1; i5 < allCardList.length; ++i5) {
                targetPossibleHandList.push([
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
    } else {
      targetPossibleHandList = partialPossibleHandList;
    }
    let expectedValueSum = 0;
    const caseStatistics: IExpectedOutcome = { case_count: 0, result: {} };
    for (const key in this.pay_table) {
      caseStatistics.result[key] = 0;
    }
    console.log("Start to calculate RTP");
    const startTime = Date.now();
    const progressUnit = Math.floor(targetPossibleHandList.length / 1000);
    for (let i = 0; i < targetPossibleHandList.length; ++i) {
      if (i % progressUnit === 0) {
        this.emit.progress(i + 1, targetPossibleHandList.length);
      }
      const possibleHand = targetPossibleHandList[i];
      const mainDeckExpectedValueWithPossibleHoldingHandList = this.optimal_hold_target_selector.getExpectedValueWithPossibleHoldingHandList(possibleHand);
      const highestExpectedValueWithHand = mainDeckExpectedValueWithPossibleHoldingHandList.reduce(function (acc, cur) {
        if (acc.expected_value < cur.expected_value) {
          return cur;
        } else {
          return acc;
        }
      });
      expectedValueSum += highestExpectedValueWithHand.expected_value;
      // TODO: 'case_count' is not useful -> better statistics?
      for (const key in highestExpectedValueWithHand.outcome.result) {
        highestExpectedValueWithHand.outcome.result[key] /= highestExpectedValueWithHand.outcome.case_count;
      }
      highestExpectedValueWithHand.outcome.case_count = 1;
      mergeByAdd(caseStatistics, highestExpectedValueWithHand.outcome);
    }
    const endTime = Date.now();
    console.log(`${targetPossibleHandList.length} cases took ${(endTime - startTime) / 1000} seconds`);

    const result: IRTPCalculatorResult = {
      hand_count: targetPossibleHandList.length,
      expected_value_sum: expectedValueSum,
      statistics: caseStatistics,
    };
    this.emit.done(result);
    return result;
  }

  calculateRTPParallel() {
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

    const numCPUs = Math.ceil(os.cpus().length / 2);
    if (cluster.isMaster) {
      const totalCaseCount = allPossibleHandList.length;
      const countPerNode = Math.floor(totalCaseCount / numCPUs);
      for (let i = 0; i < numCPUs; i++) {
        cluster.fork({
          from_index: i * countPerNode,
          to_index: i < numCPUs - 1 ? (i + 1) * countPerNode - 1 : totalCaseCount - 1,
        });
      }

      // Merge result
      const result: any = {};
      const progressPerWorker = {};
      let workerGrossProcessedCaseCount = 0;
      const progressUnit = totalCaseCount / 100;
      let nextProgress = 0;
      const messageHandler = function (id, msg) {
        if (msg.cmd === 'done') {
          RTPCalculator.mergeStatistics(result, msg.stats);
        } else if (msg.cmd === 'err') {
          this.emit.error(RTPCalculator.objectToErr(msg.err));
          process.exit(1);
        } else if (msg.cmd === 'progress') {
          workerGrossProcessedCaseCount += progressPerWorker[id] ? msg.processed_case_count - progressPerWorker[id] : msg.processed_case_count;
          progressPerWorker[id] = msg.processed_case_count;
          if (workerGrossProcessedCaseCount > nextProgress * progressUnit) {
            nextProgress += 0.1;
            process.stdout.write(`${(workerGrossProcessedCaseCount / totalCaseCount * 100).toFixed(1)}%\r`);
          }
        }
      };
      for (const id in cluster.workers) {
        cluster.workers[id].on('message', messageHandler.bind(this, id));
      }
      // Finish all finished
      let finishedWorkers = 0;
      cluster.on('exit', function (worker, code, signal) {
        finishedWorkers++;
        if (finishedWorkers === numCPUs) {
          process.stdout.write('100%\r\n');
          this.emit.doneParallel(result);
        }
      }.bind(this));
    } else {
      this.emit.progress = function (processedCaseCount, targetCaseCount) {
        process.send({ cmd: 'progress', processed_case_count: processedCaseCount, target_case_count: targetCaseCount });
      };
      this.emit.done = function (result) {
        process.send({ cmd: 'done', stats: result });
        process.exit(0);
      };

      this.emit.error = function (err) {
        process.send({ cmd: 'err', err: RTPCalculator.errToObject(err) });
        process.exit(1);
      };

      this.calculateRTP(allPossibleHandList.splice(Number(process.env.from_index), Number(process.env.to_index) - Number(process.env.from_index) + 1));
    }
  }

  printDefaultStatistics(result: IRTPCalculatorResult) {
    console.log('Raw result data:');
    console.log(JSON.stringify(result, null, 4));
    console.log('-----------------------------');
    for (const key in this.pay_table) {
      console.log(`[${key}]
      Frequency: 1 for ${result.statistics.case_count / result.statistics.result[key]}
      Probability: ${result.statistics.result[key] / result.statistics.case_count}
      Pay: ${this.pay_table[key]}
      RTP: ${result.statistics.result[key] * this.pay_table[key] / result.statistics.case_count}`);
    }
    console.log(`total RTP: ${result.expected_value_sum / result.hand_count} `);
  }

  static mergeStatistics(toObject: object, fromObject: object) {
    for (const key in fromObject) {
      if (toObject[key] == null) {
        // Deep copy
        toObject[key] = JSON.parse(JSON.stringify(fromObject[key]));
      } else if (fromObject[key] == null) {
        continue;
      } else {
        const toType = typeof toObject[key];
        const fromType = typeof fromObject[key];
        if (toType !== fromType) {
          throw new Error(`Merge failed: type of ${key} mismatch.${toType} (${toObject[key]}) vs ${fromType} (${fromObject[key]}) `);
        }
        switch (toType) {
          case 'number':
            toObject[key] += fromObject[key];
            break;

          case 'object':
            RTPCalculator.mergeStatistics(toObject[key], fromObject[key]);
            break;

          case 'string':
            break;

          default:
            throw new Error(`Unhandled case: ${key} => ${toObject[key]} (${toType}) `);
        }
      }
    }
  }

  static errToObject(err) {
    const obj = {
      message: err.message,
      stack: err.stack,
    };
    for (const key in err) {
      obj[key] = err[key];
    }
    return obj;
  }

  static objectToErr(obj) {
    const err = new Error(obj.message);
    err.stack = obj.stack;
    for (const key in obj) {
      err[key] = obj[key];
    }
    return err;
  }
}

/* Game Test */
// class PayCalculatorTester<K extends IPayCalculator> {
//   pay_calculator: K;
//   statistics: IPayTitleMap<number>;

//   constructor(payCalculator: K) {
//     this.pay_calculator = payCalculator;
//     const emptyStatistics: IPayTitleMap<number> = {};
//     for (let key in this.pay_calculator.pay_table) {
//       emptyStatistics[key] = 0;
//     }
//     this.statistics = emptyStatistics;
//   }

//   calculatePayForAllPossibleHand() {
//     const newDeck = new Deck();
//     const cardList = newDeck.card_list;
//     const allPossibleHandList: TCard[][] = [];
//     for (let i1 = 0; i1 < cardList.length - 4; ++i1) {
//       for (let i2 = i1 + 1; i2 < cardList.length - 3; ++i2) {
//         for (let i3 = i2 + 1; i3 < cardList.length - 2; ++i3) {
//           for (let i4 = i3 + 1; i4 < cardList.length - 1; ++i4) {
//             for (let i5 = i4 + 1; i5 < cardList.length; ++i5) {
//               allPossibleHandList.push([
//                 cardList[i1],
//                 cardList[i2],
//                 cardList[i3],
//                 cardList[i4],
//                 cardList[i5],
//               ]);
//             }
//           }
//         }
//       }
//     }
//     console.log("ALL POSSIBLE HAND COUNT: " + allPossibleHandList.length);

//     for (let i = 0; i < allPossibleHandList.length; ++i) {
//       const hand = allPossibleHandList[i];
//       const result = this.pay_calculator.calculateHandResult(hand);
//       if (result.pay_title) {
//         this.statistics[result.pay_title]++;
//       }
//     }

//     return this.statistics;
//   }
// }

/* Utility */
// function getICardString(card: ICard): string {
//   const suit = card.suit;
//   let suitString: string;
//   switch (suit) {
//     case Suit.Clover:
//       suitString = "Clover";
//       break;
//     case Suit.Diamond:
//       suitString = "Diamond";
//       break;
//     case Suit.Heart:
//       suitString = "Heart";
//       break;
//     case Suit.Spade:
//       suitString = "Spade";
//       break;
//     default:
//       throw new Error('Invalid suit');
//   }
//   let rankString = card.rank.toString();
//   switch (rankString) {
//     case '1':
//       rankString = 'A';
//       break;
//     case '11':
//       rankString = 'J';
//       break;
//     case '12':
//       rankString = 'Q';
//       break;
//     case '13':
//       rankString = 'K';
//       break;
//     default:
//       break;
//   }
//   return `${suitString} -${rankString} `;
// }

// function printCard(card: TCard) {
//   const cardObject = convertCardToObject(card);
//   const cardString = getICardString(cardObject);
//   console.log(`Card: ${cardString} `);
// }

// function printCardList(cardList: TCard[]) {
//   const cardObjectList = cardList.map(convertCardToObject);
//   const cardStringList = cardObjectList.map(getICardString);
//   const cardListString = cardStringList.join(', ');
//   console.log(`Cards: ${cardListString} `);
// }

/* Simulator */
function noop() { }

interface ISimulatorStatistics {
  trial_count: number;
  main_pay_count_statistics: IPayTitleMap<number>;
  sub_pay_count_statistics_list: IPayTitleMap<number>[];
  main_pay_statistics: IPayTitleMap<number>;
  sub_pay_statistics_list: IPayTitleMap<number>[];
}

interface ISimulatorEventSpec {
  progress: (totalTrialCount: number, targetTrialCount: number) => void;

  error: (err: Error) => void;

  done: (statistics: ISimulatorStatistics) => void;

  doneParallel: (statistics: ISimulatorStatistics) => void;
}

export class Simulator<G extends IPokerGame> {
  game: G;
  hold_target_selector: IHoldTargetSelector;
  main_pay_count_statistics: IPayTitleMap<number>;
  sub_deck_count: number;
  sub_pay_count_statistics_list: IPayTitleMap<number>[];
  main_pay_statistics: IPayTitleMap<number>;
  sub_pay_statistics_list: IPayTitleMap<number>[];
  emit: ISimulatorEventSpec;

  constructor(game: G, selector: IHoldTargetSelector, subDeckCount: number = 0) {
    this.game = game;
    this.hold_target_selector = selector;
    const emptyMainStatistics: IPayTitleMap<number> = {};
    for (const key in game.pay_calculator.pay_table) {
      emptyMainStatistics[key] = 0;
    }
    this.main_pay_count_statistics = emptyMainStatistics;
    this.main_pay_statistics = Object.assign({}, emptyMainStatistics);
    this.sub_deck_count = subDeckCount;
    this.sub_pay_count_statistics_list = [];
    this.sub_pay_statistics_list = [];
    for (let i = 0; i < subDeckCount; ++i) {
      this.sub_pay_count_statistics_list.push(Object.assign({}, emptyMainStatistics));
      this.sub_pay_statistics_list.push(Object.assign({}, emptyMainStatistics));
    }
    this.emit = {
      error: noop,
      done: noop,
      doneParallel: noop,
      progress: noop,
    };
  }

  run(trialCount: number) {
    const startTime = Date.now();
    const progressUnit = trialCount / 100;
    for (let i = 0; i < trialCount; ++i) {
      if (i % progressUnit === 0) {
        this.emit.progress(i, trialCount);
      }
      this.game.newGame();
      const indexList = this.hold_target_selector.selectHoldTargetIndices(this.game.main_hand);
      this.game.discardAndDrawCards(indexList, this.sub_deck_count);
      const result = this.game.getGameResult();
      if (result.main_hand_result.pay_title) {
        this.main_pay_count_statistics[result.main_hand_result.pay_title]++;
        this.main_pay_statistics[result.main_hand_result.pay_title] += result.main_hand_result.pay;
      }
      for (let i = 0; i < this.game.sub_hand_list.length; ++i) {
        const subHandResult = result.sub_hand_result_list[i];
        const subPayCountStatistics = this.sub_pay_count_statistics_list[i];
        const subPayStatistics = this.sub_pay_statistics_list[i];
        if (subHandResult.pay_title) {
          subPayCountStatistics[subHandResult.pay_title]++;
          subPayStatistics[subHandResult.pay_title] += subHandResult.pay;
        }
      }
    }
    const endTime = Date.now();
    console.log(`${trialCount} cases took ${(endTime - startTime) / 1000} seconds.`);
    this.emit.done({
      trial_count: trialCount,
      main_pay_count_statistics: this.main_pay_count_statistics,
      sub_pay_count_statistics_list: this.sub_pay_count_statistics_list,
      main_pay_statistics: this.main_pay_statistics,
      sub_pay_statistics_list: this.sub_pay_statistics_list,
    });
  }

  runParallel(targetTrialCount: number) {
    const numCPUs = Math.ceil(os.cpus().length / 2);
    if (cluster.isMaster) {
      const targetCount = targetTrialCount;
      const countPerNode = Math.floor(targetCount / numCPUs);
      for (let i = 0; i < numCPUs; i++) {
        cluster.fork({
          count_per_node: (i > 0 ? countPerNode : (targetCount - (countPerNode * (numCPUs - 1)))),
        });
      }

      // Merge result
      const result = {};
      const progressPerWorker = {};
      let workerGrossTrialCount = 0;
      const progressUnit = targetTrialCount / 100;
      const messageHandler = function (id, msg) {
        if (msg.cmd === 'done') {
          Simulator.mergeStatistics(result, msg.stats);
        } else if (msg.cmd === 'err') {
          this.emit.error(Simulator.objectToErr(msg.err));
          process.exit(1);
        } else if (msg.cmd === 'progress') {
          workerGrossTrialCount += progressPerWorker[id] ? msg.total_trial_count - progressPerWorker[id] : msg.total_trial_count;
          progressPerWorker[id] = msg.total_trial_count;
          if (workerGrossTrialCount % progressUnit === 0) {
            process.stdout.write(`${(workerGrossTrialCount / targetTrialCount * 100).toFixed(0)}%\r`);
          }
        }
      };
      for (const id in cluster.workers) {
        cluster.workers[id].on('message', messageHandler.bind(this, id));
      }
      // Finish all finished
      let finishedWorkers = 0;
      cluster.on('exit', function (worker, code, signal) {
        finishedWorkers++;
        if (finishedWorkers === numCPUs) {
          process.stdout.write('100%\r\n');
          this.emit.doneParallel(result);
        }
      }.bind(this));
    } else {
      this.emit.progress = function (totalTrialCount, targetTrialCount) {
        process.send({ cmd: 'progress', total_trial_count: totalTrialCount, target_trial_count: targetTrialCount });
      };
      this.emit.done = function (statistics) {
        process.send({ cmd: 'done', stats: statistics });
        process.exit(0);
      };

      this.emit.error = function (err) {
        process.send({ cmd: 'err', err: Simulator.errToObject(err) });
        process.exit(1);
      };

      this.run(Number(process.env.count_per_node));
    }
  }

  static mergeStatistics(toObject: object, fromObject: object) {
    for (const key in fromObject) {
      if (toObject[key] == null) {
        // Deep copy
        toObject[key] = JSON.parse(JSON.stringify(fromObject[key]));
      } else if (fromObject[key] == null) {
        continue;
      } else {
        const toType = typeof toObject[key];
        const fromType = typeof fromObject[key];
        if (toType !== fromType) {
          throw new Error(`Merge failed: type of ${key} mismatch.${toType} (${toObject[key]}) vs ${fromType} (${fromObject[key]}) `);
        }
        switch (toType) {
          case 'number':
            toObject[key] += fromObject[key];
            break;

          case 'object':
            Simulator.mergeStatistics(toObject[key], fromObject[key]);
            break;

          case 'string':
            break;

          default:
            throw new Error(`Unhandled case: ${key} => ${toObject[key]} (${toType}) `);
        }
      }
    }
  }

  static errToObject(err) {
    const obj = {
      message: err.message,
      stack: err.stack,
    };
    for (const key in err) {
      obj[key] = err[key];
    }
    return obj;
  }

  static objectToErr(obj) {
    const err = new Error(obj.message);
    err.stack = obj.stack;
    for (const key in obj) {
      err[key] = obj[key];
    }
    return err;
  }

  static printDefaultStatistics(result: ISimulatorStatistics) {
    console.log('RAW VALUES:');
    console.log(JSON.stringify(result, null, 4));

    console.log('-------------------------------');

    let mainTotalPay = 0;
    console.log('MAIN HAND:');
    for (const payTitle in result.main_pay_count_statistics) {
      mainTotalPay += result.main_pay_statistics[payTitle];
      console.log(`RTP(${payTitle}): ${result.main_pay_statistics[payTitle] / result.trial_count} `);
    }
    console.log('-> RTP: ' + mainTotalPay / result.trial_count);

    const subTotalPayList = result.sub_pay_statistics_list.map(function (subPayStatistics, idx) {
      let subTotalPay = 0;
      console.log('-------------------------------');
      console.log('SUB HAND #' + (idx + 1));
      for (const payTitle in subPayStatistics) {
        subTotalPay += subPayStatistics[payTitle];
        console.log(`RTP(${payTitle}): ${subPayStatistics[payTitle] / result.trial_count} `);
      }
      console.log('-> RTP: ' + subTotalPay / result.trial_count);
      return subTotalPay;
    });

    const totalPay = mainTotalPay + (subTotalPayList.length > 0 ? subTotalPayList.reduce((a, b) => a + b) : 0);
    const deckAmount = 1 + result.sub_pay_statistics_list.length;
    console.log('-------------------------------');
    console.log('TOTAL RTP: ' + totalPay / (result.trial_count * deckAmount));
  }
}

/* Simulator Usage */
// const payCalculator = new PayCalculator(doubleDoubleBonusPayTable, allPayTitleToJudgeFuncMap);
// const payCalculatorTester = new PayCalculatorTester(payCalculator);
// console.log(JSON.stringify(payCalculatorTester.calculatePayForAllPossibleHand(), null, 4));
// console.log("-------------------------------------------------------------------");

// const game = new BasicPokerGame(jacksOrBetterPayTable, allPayTitleToJudgeFuncMap);
// const selector = new OptimalHoldTargetSelector(game.pay_calculator);
// const subDeckCount = 0;
// const trialCount = 100000;
// const simulator = new Simulator(game, selector, subDeckCount);
// simulator.emit.doneParallel = simulator.printDefaultStatistics.bind(simulator);
// simulator.runParallel(trialCount);

// const game = new BasicPokerGame(jacksOrBetterPayTable, allPayTitleToJudgeFuncMap);
// const selector = new OptimalHoldTargetSelector(game.pay_calculator);
// const cardList: ICard[] = [
//   { suit: Suit.Diamond, rank: '12' },
//   { suit: Suit.Diamond, rank: '7' },
//   { suit: Suit.Spade, rank: '13' },
//   { suit: Suit.Heart, rank: '6' },
//   { suit: Suit.Clover, rank: '7' },
// ];
// console.log("FINAL RESULT:");
// console.log(JSON.stringify(selector.selectHoldTargetIndices(cardList.map(convertObjectToCard))));
// console.log("-------------");

// const game = new BasicPokerGame(jacksOrBetterPayTable, allPayTitleToJudgeFuncMap);
// const selector = new OptimalHoldTargetSelector(game.pay_calculator);
// const rtpCalculator = new RTPCalculator(game.pay_calculator.pay_table, selector);
// rtpCalculator.emit.doneParallel = rtpCalculator.printDefaultStatistics.bind(rtpCalculator);
// rtpCalculator.calculateRTPParallel();

// const game = new CheatedPokerGame(jacksOrBetterPayTable, allPayTitleToJudgeFuncMap);
// const selector = new CheatedOptimalHoldTargetSelector(game);
// const trialCount = 10000000;
// const simulator = new Simulator(game, selector, 0);
// simulator.emit.doneParallel = simulator.printDefaultStatistics.bind(simulator);
// simulator.runParallel(trialCount);
