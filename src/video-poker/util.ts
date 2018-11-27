import {
  Suit,
  TRank,
  TCard,
  ICard,
} from './types';

export function classifyCardsBySuit(cardList: TCard[]): { [value in Suit]: TCard[] } {
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
  
export function classifyCardsByRank(cardList: TCard[]): { [value in TRank]: TCard[] } {
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

export function convertObjectToCard(card: ICard): TCard {
  return Number(card.suit) * 13 + Number(card.rank) - 1 as TCard;
}

export function convertCardToObject(card: TCard): ICard {
  let calculatedSuit: Suit;
  switch (Math.floor(card / 13)) {
      case 0:
      calculatedSuit = Suit.Heart;
      break;
      case 1:
      calculatedSuit = Suit.Diamond;
      break;
      case 2:
      calculatedSuit = Suit.Spade;
      break;
      case 3:
      calculatedSuit = Suit.Clover;
      break;
      default:
      throw new Error(`Invalid card number: ${card}`);
  }
  const calculatedRank = (card % 13 + 1).toString() as TRank;
  return { suit: calculatedSuit, rank: calculatedRank };
}

export function getICardString(card: ICard): string {
  const suit = card.suit;
  let suitString: string;
  switch (suit) {
    case Suit.Clover:
      suitString = "Clover";
      break;
    case Suit.Diamond:
      suitString = "Diamond";
      break;
    case Suit.Heart:
      suitString = "Heart";
      break;
    case Suit.Spade:
      suitString = "Spade";
      break;
    default:
      throw new Error('Invalid suit');
  }
  let rankString = card.rank.toString();
  switch (rankString) {
    case '1':
      rankString = 'A';
      break;
    case '11':
      rankString = 'J';
      break;
    case '12':
      rankString = 'Q';
      break;
    case '13':
      rankString = 'K';
      break;
    default:
      break;
  }
  return `${suitString} -${rankString} `;
}

export function printCard(card: TCard) {
  const cardObject = convertCardToObject(card);
  const cardString = getICardString(cardObject);
  console.log(`Card: ${cardString} `);
}

export function printCardList(cardList: TCard[]) {
  const cardObjectList = cardList.map(convertCardToObject);
  const cardStringList = cardObjectList.map(getICardString);
  const cardListString = cardStringList.join(', ');
  console.log(`Cards: ${cardListString} `);
}
