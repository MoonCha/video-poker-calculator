import {
  Suit,
  TRank,
  TCard,
  IPayTitleMap,
  IJudgeFunc,
} from './types';
import { classifyCardsBySuit } from './util';

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
