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
  StreamStarting = 'stream_starting',
  StreamEnding = 'stream_ending',
  Streaming = 'streaming',
  StreamReconnecting = 'stream_reconnecting',
  Closing = 'closing',
  CleanExit = 'clean_exit',
}

interface ICrashReporterState {
  code: EAppState;
  version: string; // SLOBS version
}

export class CrashReporterService extends Service {
  private appState: ICrashReporterState;

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
    this.appState = this.readStateFile();

    // Report any crash that happened last time
    if (this.appState.code !== EAppState.CleanExit) {
      this.usageStatisticsService.recordEvent('crash', {
        crashType: this.appState,
      });
    }

    this.writeStateFile(EAppState.Starting);
  }

  endStartup() {
    this.writeStateFile(EAppState.Idle);

    this.streamingSubscription = this.streamingService.streamingStatusChange.subscribe(status => {
      switch (status) {
        case EStreamingState.Starting:
          this.writeStateFile(EAppState.StreamStarting);
          break;
        case EStreamingState.Reconnecting:
          this.writeStateFile(EAppState.StreamReconnecting);
          break;
        case EStreamingState.Live:
          this.writeStateFile(EAppState.Streaming);
          break;
        case EStreamingState.Ending:
          this.writeStateFile(EAppState.StreamEnding);
          break;
        case EStreamingState.Offline:
          this.writeStateFile(EAppState.Idle);
          break;
      }
    });
  }

  beginShutdown() {
    this.streamingSubscription.unsubscribe();
    this.writeStateFile(EAppState.Closing);
  }

  endShutdown() {
    this.writeStateFile(EAppState.CleanExit);
  }

  private writeStateFile(code: EAppState) {
    this.appState = { code, version: this.version };
    if (process.env.NODE_ENV !== 'production') return;
    try {
      fs.writeFileSync(this.appStateFile, JSON.stringify(this.appState));
    } catch (e) {
      console.error('Error writing app state file', e);
    }
  }

  private get appStateFile() {
    return path.join(electron.remote.app.getPath('userData'), 'appState');
  }

  private readStateFile(): ICrashReporterState {
    const clearState = { code: EAppState.CleanExit, version: this.version };
    try {
      if (!fs.existsSync(this.appStateFile)) return clearState;
      const stateString = fs.readFileSync(this.appStateFile).toString() as EAppState;
      try {
        return JSON.parse(stateString);
      } catch (e) {
        // the old version of crash-reporter file contained only a code string
        return { code: stateString, version: this.version };
      }
    } catch (e) {
      console.error('Error loading app state file', e);
      return clearState;
    }
  }

  private get version(): string {
    return electron.remote.process.env.SLOBS_VERSION;
  }
}
