import { StatefulService, mutation } from '../stateful-service';
import * as obs from '../../../obs-api';
import { Inject } from '../../util/injector';
import { NotificationsService, ENotificationType } from 'services/notifications';
import { ServicesManager } from '../../services-manager';

const INTERVAL = 30000;
const SKIPPED_THRESHOLD = 0.3;
const LAGGED_THRESHOLD = 0.1;

interface IMonitorState {
  framesLagged: number;
  framesRendered: number;
  framesSkipped: number;
  framesEncoded: number;
}

export type TPerformanceIssueCode = 'FRAMES_LAGGED' | 'FRAMES_SKIPPED';

/**
 * Keeps a store of up-to-date performance metrics
 *
 * Every 30 seconds, monitor lagged and skipped frames to make sure
 * they aren't out of control. If they are above a certain threshold
 * send a notification to the use that something's wrong
 */
export class PerformanceMonitorService extends StatefulService<IMonitorState> {

  static initialState: IMonitorState = {
    framesLagged: 0, 
    framesRendered: 0,
    framesSkipped: 0,
    framesEncoded: 0
  };

  @Inject() private notificationsService: NotificationsService;
  servicesManager: ServicesManager = ServicesManager.instance;

  private intervalId: number = null;


  start() {
    if (this.intervalId) return;

    this.intervalId = window.setInterval(() => {
      this.update();
    }, INTERVAL);
  }


  stop() {
    if (!this.intervalId) return;
    clearInterval(this.intervalId);
    this.intervalId = null;
  }

  private update() {
    /* Fetch variables only once. */
    const currentStats: IMonitorState = {
      framesLagged: obs.Global.laggedFrames,
      framesRendered: obs.Global.totalFrames,
      framesSkipped: obs.Video.skippedFrames,
      framesEncoded: obs.Video.totalFrames
    };

    if (currentStats.framesEncoded !== 0) {
      const framesSkipped = currentStats.framesSkipped - this.state.framesSkipped;
      const framesEncoded = currentStats.framesEncoded - this.state.framesEncoded;
      const skippedFactor = framesSkipped / framesEncoded;

      if (skippedFactor > SKIPPED_THRESHOLD) {

        this.pushSkippedFrameNotify(skippedFactor);
      }
    }

    if (currentStats.framesRendered !== 0) {
      const framesLagged = currentStats.framesLagged - this.state.framesLagged;
      const framesRendered = currentStats.framesRendered - this.state.framesRendered;
      const laggedFactor = framesLagged / framesRendered;

      if (laggedFactor > LAGGED_THRESHOLD) {
        this.pushLaggedFrameNotify(laggedFactor);
      }
    }

    this.SET_STATE(currentStats);
  }

  private pushSkippedFrameNotify(factor: number) {
    const code = 'FRAMES_SKIPPED';
    this.notificationsService.push({
      type: ENotificationType.WARNING,
      code,
      message: `Skipped frames detected: ${ Math.round(factor * 100)}%`,
      action: this.servicesManager.createRequest(
        this.notificationsService, 'showTroubleshooter', code
      )
    });
  }


  private pushLaggedFrameNotify(factor: number) {
    const code = 'FRAMES_LAGGED';
    this.notificationsService.push({
      type: ENotificationType.WARNING,
      code,
      message: `Lagged frames detected: ${ Math.round(factor * 100)}%`,
      action: this.servicesManager.createRequest(
        this.notificationsService, 'showTroubleshooter', code
      )
    });
  }



  @mutation()
  private SET_STATE(stats: IMonitorState) {
    this.state = stats;
  }

}
