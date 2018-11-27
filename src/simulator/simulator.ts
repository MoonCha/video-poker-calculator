import {
  IPayTitleMap,
  IPokerGame,
} from '../video-poker/types';
import {
  IHoldTargetSelector,
} from '../hold-target-selector/types';
import {
  ISimulatorEventSpec,
  ISimulatorStatistics,
} from './types';
import * as os from 'os';
import * as cluster from 'cluster';

function noop() { }

export default class Simulator<G extends IPokerGame> {
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
