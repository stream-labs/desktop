import { Service } from 'services/core/service';
import { ipcRenderer } from 'electron';
import { Inject } from '../core';
import { PerformanceService } from 'services/performance';
import Utils from '../utils';

export interface IMetricsState {
  appStartTime: number;
  mainWindowShowTime: number;
  sceneCollectionLoadingTime: number;
}

/**
 * An utility service that keeps the time of some key events to help find performance issues
 * This services is used in performance tests
 */
export class MetricsService extends Service {
  @Inject() performanceService: PerformanceService;

  protected init() {
    if (!Utils.isDevMode()) return;
    const appStarTime = ipcRenderer.sendSync('getAppStartTime');
    this.recordMetric('appStartTime', appStarTime);
  }

  private metrics: IMetricsState = {
    appStartTime: 0,
    mainWindowShowTime: 0,
    sceneCollectionLoadingTime: 0,
  };

  getMetrics() {
    return this.metrics;
  }

  recordMetric(metricName: keyof IMetricsState, time = Date.now()) {
    this.metrics[metricName] = time;
  }
}
