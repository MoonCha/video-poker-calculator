import {
    TCard,
    IDeck,
} from './types';

export default class Deck implements IDeck {
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
