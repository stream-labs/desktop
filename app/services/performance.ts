import Vue from 'vue';
import { Subject } from 'rxjs';

import { StatefulService, mutation } from './stateful-service';
import electron from 'electron';
import * as obs from '../../obs-api';

interface IPerformanceState {
  CPU: number;
  numberDroppedFrames: number;
  percentageDroppedFrames: number;
  bandwidth: number;
  frameRate: number;
}

const STATS_UPDATE_INTERVAL = 2 * 1000;

// TODO: merge this service with PerformanceMonitorService

// Keeps a store of up-to-date performance metrics
export class PerformanceService extends StatefulService<IPerformanceState> {
  static initialState: IPerformanceState = {
    CPU: 0,
    numberDroppedFrames: 0,
    percentageDroppedFrames: 0,
    bandwidth: 0,
    frameRate: 0,
  };

  droppedFramesDetected = new Subject<number>();
  private intervalId: number;

  measurements: number[];

  @mutation()
  private SET_PERFORMANCE_STATS(stats: IPerformanceState) {
    Object.keys(stats).forEach(stat => {
      Vue.set(this.state, stat, stats[stat]);
    });
  }

  init() {
    this.intervalId = window.setInterval(() => {
      electron.ipcRenderer.send('requestPerformanceStats');
    }, STATS_UPDATE_INTERVAL);

    electron.ipcRenderer.on(
      'performanceStatsResponse',
      (e: electron.Event, am: electron.ProcessMetric[]) => {
        const stats: IPerformanceState = obs.NodeObs.OBS_API_getPerformanceStatistics();
        if (stats.percentageDroppedFrames) {
          this.droppedFramesDetected.next(stats.percentageDroppedFrames / 100);
        }

        const electronCpu = am
          .map(proc => {
            return proc.cpu.percentCPUUsage;
          })
          .reduce((sum, usage) => sum + usage);

        if (this.measurements != null) {
          this.measurements.push(electronCpu);
        }

        if (this.measurements && this.measurements.length >= 60) {
          console.log(
            `Average Electron CPU over ${this.measurements.length} measurements:`,
            this.measurements.reduce((sum, meas) => sum + meas, 0) / this.measurements.length,
          );

          this.measurements = null;
        }

        stats.CPU += electronCpu;

        this.SET_PERFORMANCE_STATS(stats);
      },
    );

    window['startMeasure'] = () => {
      this.measurements = [];
    };
  }

  stop() {
    clearInterval(this.intervalId);
    this.SET_PERFORMANCE_STATS(PerformanceService.initialState);
  }
}
