import {
    TCard,
    IPayTitleMap,
    IJudgeFunc,
    IHandResult,
    IPayCalculator,
} from './types';
import { classifyCardsBySuit, classifyCardsByRank } from './util';

export default class PayCalculator implements IPayCalculator {
  pay_table: Readonly<IPayTitleMap<number>>;
  judge_func_map: IPayTitleMap<IJudgeFunc>;
  judge_func_with_pay_title_array: { pay_title: keyof IPayTitleMap<number>, judge_func: IJudgeFunc }[];

  constructor(payTable: IPayTitleMap<number>, payTitleToJudgeFuncMap: IPayTitleMap<IJudgeFunc>) {
    this.pay_table = payTable;
    const judgeFuncMap: IPayTitleMap<IJudgeFunc> = {};
    this.judge_func_with_pay_title_array = [];
    // Note: property should be ordered by priority (higher first)
    // e.g.) JAKCS_OR_BETTER should located after FULL_HOUSE.
    // If not, FULL_HOUSE hand can be payed as if it is JACKS_OR_BETTER
    const payTitleList = Object.entries(this.pay_table).sort((a,b) => b[1]-a[1]).map(([n]) => n) as (keyof IPayTitleMap<number>)[];
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
