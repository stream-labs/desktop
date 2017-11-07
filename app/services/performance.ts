import Vue from 'vue';

import { StatefulService, mutation } from './stateful-service';
import { nodeObs } from './obs-api';
import * as obs from '../../obs-api';

interface IPerformanceState {
  CPU: number;
  numberDroppedFrames: number;
  percentageDroppedFrames: number;
  bandwidth: number;
  frameRate: number;
}

// Keeps a store of up-to-date performance metrics
export class PerformanceService extends StatefulService<IPerformanceState> {

  static initialState: IPerformanceState = {
    CPU: 0,
    numberDroppedFrames: 0,
    percentageDroppedFrames: 0,
    bandwidth: 0,
    frameRate: 0
  };

  @mutation()
  SET_PERFORMANCE_STATS(stats: IPerformanceState) {
    Object.keys(stats).forEach(stat => {
      Vue.set(this.state, stat, stats[stat]);
    });
  }

  init() {
    setInterval(() => {
      this.SET_PERFORMANCE_STATS(nodeObs.OBS_API_getPerformanceStatistics());
    }, 2 * 1000);
  }

}
