import {
  TCard,
} from '../video-poker/types';
import {
  IExpectedOutcome,
} from './types';

export function* subsets<U>(list: U[], offset = 0): IterableIterator<U[]> {
  while (offset < list.length) {
    const first = list[offset++];
    for (const subset of subsets(list, offset)) {
      subset.push(first);
      yield subset;
    }
  }
  yield [];
}

export function* subsetsWithoutEmpty<U>(list: U[], offset = 0): IterableIterator<U[]> {
  while (offset < list.length) {
    const first = list[offset++];
    for (const subset of subsets(list, offset)) {
      subset.push(first);
      yield subset;
    }
  }
}

export function combination(n: number, r: number): number {
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

export function cardListToIndex(cardList: TCard[]): number {
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

export function mergeByAdd(into: IExpectedOutcome, target: IExpectedOutcome): IExpectedOutcome {
  into.case_count += target.case_count;
  for (const key in target.result) {
    if (into.result[key] == null) {
      into.result[key] = 0;
    }
    into.result[key] += target.result[key];
  }
  return into;
}

export function mergeBySubtract(into: IExpectedOutcome, target: IExpectedOutcome): IExpectedOutcome {
  into.case_count -= target.case_count;
  for (const key in target.result) {
    if (into.result[key] == null) {
      into.result[key] = 0;
    }
    into.result[key] -= target.result[key];
  }
  return into;
}
