import { Service } from 'services/service';
import electron from 'electron';
import { StreamingService, EStreamingState } from 'services/streaming';
import { Inject } from 'util/injector';
import { Subscription } from 'rxjs';
import path from 'path';
import fs from 'fs';
import { UsageStatisticsService } from 'services/usage-statistics';

/**
 * If we start up and the app is in anything other than the
 * CleanExit state, we know that we crashed, and we can report,
 * the state the app was in when we crashed.
 */
enum EAppState {
  Starting = 'starting',
  Idle = 'idle',
  StartStreaming = 'start_streaming',
  Streaming = 'streaming',
  StopStreaming = 'stop_streaming',
  Reconnecting = 'reconnecting',
  Closing = 'closing',
  CleanExit = 'clean_exit',
}

export class CrashReporterService extends Service {
  appState = EAppState.CleanExit;

  @Inject() streamingService: StreamingService;
  @Inject() usageStatisticsService: UsageStatisticsService;

  streamingSubscription: Subscription;

  ///////////////////////////////////////////////////////////////
  // The following 4 methods are called by the app service
  // at the beggining and end of the shutdown procedures.
  // These are not handled via events because the order of
  // operations here is extremely important, so tight coupling
  // is very intentional.
  ///////////////////////////////////////////////////////////////

  beginStartup() {
    try {
      if (fs.existsSync(this.appStateFile)) {
        this.appState = fs.readFileSync(this.appStateFile).toString() as EAppState;
      }
    } catch (e) {
      console.error('Error loading app state file', e);
    }

    // Report any crash that happened last time
    if (this.appState !== EAppState.CleanExit) {
      this.usageStatisticsService.recordEvent('crash', {
        crashType: this.appState,
      });
    }

    this.setState(EAppState.Starting);
  }

  endStartup() {
    this.setState(EAppState.Idle);

    this.streamingSubscription = this.streamingService.streamingStatusChange.subscribe(status => {
      if (status === EStreamingState.Live) {
        this.setState(EAppState.Streaming);
      }

      if (status === EStreamingState.Starting) {
        this.setState(EAppState.StartStreaming);
      }

      if (status === EStreamingState.Ending) {
        this.setState(EAppState.StopStreaming);
      }

      if (status === EStreamingState.Reconnecting) {
        this.setState(EAppState.Reconnecting);
      }

      if (status === EStreamingState.Offline) {
        this.setState(EAppState.Idle);
      }
    });
  }

  beginShutdown() {
    this.streamingSubscription.unsubscribe();
    this.setState(EAppState.Closing);
  }

  endShutdown() {
    this.setState(EAppState.CleanExit);
  }

  private setState(state: EAppState) {
    this.appState = state;
    if (process.env.NODE_ENV === 'production') {
      try {
        fs.writeFileSync(this.appStateFile, state);
      } catch (e) {
        console.error('Error writing app state file', e);
      }
    }
  }

  private get appStateFile() {
    return path.join(electron.remote.app.getPath('userData'), 'appState');
  }
}
