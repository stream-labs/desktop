import Vue from 'vue';
import { Subject } from 'rxjs';

import { StatefulService, mutation } from 'services/core/stateful-service';
import { CustomizationService } from 'services/customization';
import { Inject } from 'services/core/injector';
import electron from 'electron';
import * as obs from '../../../obs-api';

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
  @Inject()
  customizationService: CustomizationService;

  static initialState: IPerformanceState = {
    CPU: 0,
    numberDroppedFrames: 0,
    percentageDroppedFrames: 0,
    bandwidth: 0,
    frameRate: 0,
  };

  droppedFramesDetected = new Subject<number>();
  private intervalId: number;
  private statsFailed: boolean = false;

  @mutation()
  SET_PERFORMANCE_STATS(stats: Partial<IPerformanceState>) {
    Object.keys(stats).forEach(stat => {
      Vue.set(this.state, stat, stats[stat]);
    });
  }

  init() {
    this.intervalId = window.setInterval(() => this.update(), STATS_UPDATE_INTERVAL);
  }

  private update() {
    const stats: IPerformanceState = this.customizationService.pollingPerformanceStatistics
      ? obs.NodeObs.OBS_API_getPerformanceStatistics()
      : { CPU: 0 };

    if (!stats) {
      if (this.statsFailed) {
        // sentry送信削減
        return;
      }
      this.statsFailed = true;
    }

    if (stats.percentageDroppedFrames) {
      this.droppedFramesDetected.next(stats.percentageDroppedFrames / 100);
    }

    const am = electron.remote.app.getAppMetrics();

    stats.CPU += am
      .map(proc => {
        return proc.cpu.percentCPUUsage;
      })
      .reduce((sum, usage) => sum + usage);

    this.SET_PERFORMANCE_STATS(stats);
  }

  stop() {
    window.clearInterval(this.intervalId);
  }
}
