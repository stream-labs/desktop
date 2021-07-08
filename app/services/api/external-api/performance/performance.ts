import { Singleton, Fallback } from 'services/api/external-api';
import { Inject } from 'services/core/injector';
import { PerformanceService as InternalPerformanceService } from 'services/performance';
import { ISerializable } from '../../rpc-api';

/**
 * Serialized representation of the performance values.
 */
interface IPerformanceState {
  CPU: number;
  numberDroppedFrames: number;
  percentageDroppedFrames: number;
  bandwidth: number;
  frameRate: number;
}

/**
 * API for performance monitoring. Provides basic information about the current
 * performance sate.
 */
@Singleton()
export class PerformanceService implements ISerializable {
  @Fallback()
  @Inject()
  private performanceService: InternalPerformanceService;

  /**
   * @returns A serialized representation of the current performance state
   */
  getModel(): IPerformanceState {
    return {
      CPU: this.performanceService.state.CPU,
      bandwidth: this.performanceService.state.streamingBandwidth,
      frameRate: this.performanceService.state.frameRate,
      numberDroppedFrames: this.performanceService.state.numberDroppedFrames,
      percentageDroppedFrames: this.performanceService.state.percentageDroppedFrames,
    };
  }
}
