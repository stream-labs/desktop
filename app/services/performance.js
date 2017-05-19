import Vue from 'vue';

import { StatefulService, mutation } from './stateful-service';
import Obs from '../api/Obs';

const nodeObs = Obs.nodeObs;

// Keeps a store of up-to-date performance metrics
export default class PerformanceService extends StatefulService {

  static initialState = {
    CPU: 0,
    numberDroppedFrames: 0,
    percentageDroppedFrames: 0,
    bandwidth: 0,
    frameRate: 0
  }

  @mutation
  SET_PERFORMANCE_STATS(stats) {
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
