import { Singleton, Fallback } from 'services/api/external-api';
import { Inject } from 'services/core/injector';
import { PerformanceService as InternalPerformanceService } from 'services/performance';

interface IPerformanceState {
  CPU: number;
  numberDroppedFrames: number;
  percentageDroppedFrames: number;
  bandwidth: number;
  frameRate: number;
}

/**
 * Api for performance monitoring
 */
@Singleton()
export class PerformanceService {
  @Fallback()
  @Inject()
  private performanceService: InternalPerformanceService;

  getModel(): IPerformanceState {
    return {
      CPU: this.performanceService.state.CPU,
      bandwidth: this.performanceService.state.bandwidth,
      frameRate: this.performanceService.state.frameRate,
      numberDroppedFrames: this.performanceService.state.numberDroppedFrames,
      percentageDroppedFrames: this.performanceService.state.percentageDroppedFrames,
    };
  }
}
