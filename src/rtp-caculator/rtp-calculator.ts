import {
  TCard,
  IPayTitleMap,
} from '../video-poker/types';
import Deck from '../video-poker/deck';
import {
  IOptimalHoldTargetSelector,
  IExpectedOutcome,
} from '../hold-target-selector/types';
import {
  IPayCalculatorEventSpec,
  IRTPCalculatorResult,
} from './types';
import { mergeByAdd } from '../hold-target-selector/util';
import * as os from 'os';
import * as cluster from 'cluster';

function noop() { }

export default class RTPCalculator<K extends IOptimalHoldTargetSelector> {
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
