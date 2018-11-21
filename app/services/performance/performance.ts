import Vue from 'vue';
import { Subject } from 'rxjs/Subject';

import { StatefulService, mutation } from 'services/stateful-service';
import { CustomizationService } from 'services/customization';
import { nodeObs } from 'services/obs-api';
import electron from 'electron';
import { Inject } from 'util/injector';

interface IPerformanceState {
  CPU: number;
  numberDroppedFrames: number;
  percentageDroppedFrames: number;
  bandwidth: number;
  frameRate: number;
}

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
    frameRate: 0
  };

  droppedFramesDetected = new Subject<number>();
  private intervalId: number;

  @mutation()
  SET_PERFORMANCE_STATS(stats: Partial<IPerformanceState>) {
    Object.keys(stats).forEach(stat => {
      Vue.set(this.state, stat, stats[stat]);
    });
  }

  init() {
    this.intervalId = setInterval(() => {
      this.updateStatistics();
    }, 2 * 1000) as any;
  }

  stop() {
    clearInterval(this.intervalId);
    this.SET_PERFORMANCE_STATS(PerformanceService.initialState);
  }

  private getStatistics(): Partial<IPerformanceState> {
    if (this.customizationService.pollingPerformanceStatistics) {
      return nodeObs.OBS_API_getPerformanceStatistics();
    }

    return {};
  }

  private updateStatistics(): void {
    const stats = this.getStatistics();

    if (stats.percentageDroppedFrames) {
      this.droppedFramesDetected.next(stats.percentageDroppedFrames / 100);
    }

    stats.CPU = electron.remote.app.getAppMetrics().map(proc => {
      return proc.cpu.percentCPUUsage;
    }).reduce((sum, usage) => sum + usage);

    this.SET_PERFORMANCE_STATS(stats);
  }
}
