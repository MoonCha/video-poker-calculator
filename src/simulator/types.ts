import {
  IPayTitleMap,
} from '../video-poker/types';

export interface ISimulatorStatistics {
  trial_count: number;
  main_pay_count_statistics: IPayTitleMap<number>;
  sub_pay_count_statistics_list: IPayTitleMap<number>[];
  main_pay_statistics: IPayTitleMap<number>;
  sub_pay_statistics_list: IPayTitleMap<number>[];
}

export interface ISimulatorEventSpec {
  progress: (totalTrialCount: number, targetTrialCount: number) => void;

  error: (err: Error) => void;

  done: (statistics: ISimulatorStatistics) => void;

  doneParallel: (statistics: ISimulatorStatistics) => void;
}
