import {
  IExpectedOutcome,
} from '../hold-target-selector/types';

export interface IRTPCalculatorResult {
  hand_count: number;
  expected_value_sum: number;
  statistics: IExpectedOutcome;
}

export interface IPayCalculatorEventSpec {
  progress: (processedCaseCount: number, targetCaseCount: number) => void;

  error: (err: Error) => void;

  done: (result: IRTPCalculatorResult) => void;

  doneParallel: (result: IRTPCalculatorResult) => void;
}
