import { PersistentStatefulService, mutation } from 'services/core';
import { tips } from './grow-data';

interface IGoal {
  name: string;
  progress: number;
  total: number;
}

interface IGrowServiceState {
  goals: IGoal[];
}

export class GrowService extends PersistentStatefulService<IGrowServiceState> {
  static initialState: IGrowServiceState = {
    goals: [],
  };

  get tips() {
    return tips();
  }
}
