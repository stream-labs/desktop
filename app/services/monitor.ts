import Vue from 'vue';

import { Service } from './service';
import { nodeObs } from './obs-api';
import * as obs from '../../obs-api';

interface IMonitorState {
  framesLagged: number;
  framesRendered: number;
  framesSkipped: number;
  framesEncoded: number;
}

// Keeps a store of up-to-date performance metrics
export class MonitorService extends Service {
  timeout: number = null;

  prevStats: IMonitorState = {
    framesLagged: 0, 
    framesRendered: 0,
    framesSkipped: 0,
    framesEncoded: 0
  };

  start() {
    if (this.timeout) return;

    /* Every 30 seconds, monitor lagged and skipped frames to make sure
     * they aren't out of control. If they are above a certain threshold, 
     * send a notification to the use that something's wrong. */
    this.timeout = window.setInterval(() => {
      /* Fetch variables only once. */
      const currentStats = {
        framesLagged: obs.Global.laggedFrames,
        framesRendered: obs.Global.totalFrames,
        framesSkipped: obs.Video.skippedFrames,
        framesEncoded: obs.Video.totalFrames
      };

      if (currentStats.framesEncoded !== 0) {
        const framesSkipped = currentStats.framesSkipped - this.prevStats.framesSkipped;
        const framesEncoded = currentStats.framesEncoded - this.prevStats.framesEncoded;
        const percentSkipped = (framesSkipped / framesEncoded) * 100;

        if (percentSkipped > 3) {
          console.log(`Skipped percentage: ${percentSkipped}% (${framesSkipped} / ${framesEncoded})`);
        }
      }

      if (currentStats.framesRendered !== 0) {
        const framesLagged = currentStats.framesLagged - this.prevStats.framesLagged;
        const framesRendered = currentStats.framesRendered - this.prevStats.framesRendered;
        const percentLagged = (framesLagged / framesRendered) * 100;

        if (percentLagged > 1) {
          console.log(`Lagged percentage: ${percentLagged}% (${framesLagged} / ${framesRendered})`);
        }
      }

      this.prevStats = currentStats;
    }, 30000);
  }

  stop() {
    if (!this.timeout) return;
    clearInterval(this.timeout);
    this.timeout = null;
  }
}
