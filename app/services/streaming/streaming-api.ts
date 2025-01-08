import { Observable } from 'rxjs';
import { IEncoderProfile } from '../video-encoding-optimizations';
import { ITwitchStartStreamOptions } from '../platforms/twitch';
import { IYoutubeStartStreamOptions } from '../platforms/youtube';
import { IFacebookStartStreamOptions } from '../platforms/facebook';
import { IStreamError } from './stream-error';
import { ICustomStreamDestination } from '../settings/streaming';
import { ITikTokStartStreamOptions } from '../platforms/tiktok';
import { ITrovoStartStreamOptions } from '../platforms/trovo';
import { IVideo } from 'obs-studio-node';
import { ITwitterStartStreamOptions } from 'services/platforms/twitter';
import { IInstagramStartStreamOptions } from 'services/platforms/instagram';
import { TDisplayType } from 'services/settings-v2';

export enum EStreamingState {
  Offline = 'offline',
  Starting = 'starting',
  Live = 'live',
  Ending = 'ending',
  Reconnecting = 'reconnecting',
}

export enum ERecordingState {
  Offline = 'offline',
  Starting = 'starting',
  Recording = 'recording',
  Stopping = 'stopping',
  Wrote = 'wrote',
}

export enum EReplayBufferState {
  Running = 'running',
  Stopping = 'stopping',
  Offline = 'offline',
  Saving = 'saving',
}

export interface IStreamInfo {
  lifecycle:
    | 'empty' // platform settings are not synchronized
    | 'prepopulate' // stetting synchronization in progress
    | 'waitForNewSettings' // platform settings has been synchronized
    | 'runChecklist' // applying new settings and start the stream
    | 'live'; // stream has been successfully started
  error: IStreamError | null;
  warning: 'YT_AUTO_START_IS_DISABLED' | '';
  settings: IGoLiveSettings | null; // settings for the current attempt of going live
  checklist: {
    applyOptimizedSettings: TGoLiveChecklistItemState;
    twitch: TGoLiveChecklistItemState;
    youtube: TGoLiveChecklistItemState;
    facebook: TGoLiveChecklistItemState;
    tiktok: TGoLiveChecklistItemState;
    trovo: TGoLiveChecklistItemState;
    twitter: TGoLiveChecklistItemState;
    instagram: TGoLiveChecklistItemState;
    setupMultistream: TGoLiveChecklistItemState;
    setupDualOutput: TGoLiveChecklistItemState;
    startVideoTransmission: TGoLiveChecklistItemState;
  };
}

export type TGoLiveChecklistItemState = 'not-started' | 'pending' | 'done' | 'failed';

export interface IStreamSettings {
  platforms: {
    twitch?: IPlatformFlags & ITwitchStartStreamOptions;
    youtube?: IPlatformFlags & IYoutubeStartStreamOptions;
    facebook?: IPlatformFlags & IFacebookStartStreamOptions;
    tiktok?: IPlatformFlags & ITikTokStartStreamOptions;
    trovo?: IPlatformFlags & ITrovoStartStreamOptions;
    twitter?: IPlatformFlags & ITwitterStartStreamOptions;
    instagram?: IPlatformFlags & IInstagramStartStreamOptions;
  };
  customDestinations: ICustomStreamDestination[];
  advancedMode: boolean;
}

export interface IGoLiveSettings extends IStreamSettings {
  optimizedProfile?: IEncoderProfile;
  tweetText?: string;
  prepopulateOptions?: {
    youtube?: Partial<IYoutubeStartStreamOptions>;
    facebook?: Partial<IFacebookStartStreamOptions>;
  };
}

export interface IPlatformFlags {
  enabled: boolean;
  useCustomFields: boolean;
  display?: TDisplayType;
  video?: IVideo;
}

export interface IStreamingServiceState {
  streamingStatus: EStreamingState;
  streamingStatusTime: string;
  recordingStatus: ERecordingState;
  recordingStatusTime: string;
  replayBufferStatus: EReplayBufferState;
  replayBufferStatusTime: string;
  selectiveRecording: boolean;
  dualOutputMode: boolean;
  info: IStreamInfo;
}

export interface IStreamingServiceApi {
  getModel(): IStreamingServiceState;

  /**
   * Subscribe to be notified when the state
   * of the streaming output changes.
   */
  streamingStatusChange: Observable<EStreamingState>;

  /**
   * Subscribe to be notified when the state
   * of the streaming output changes.
   */
  recordingStatusChange: Observable<ERecordingState>;

  /**
   * Subscribe to be notified when the state
   * of the streaming output changes.
   */
  replayBufferStatusChange: Observable<EReplayBufferState>;

  /**
   * This subscription receives no events and
   * will be removed in a future version.
   * @deprecated
   */
  streamingStateChange: Observable<void>;

  /**
   * @deprecated
   */
  startStreaming(): void;

  /**
   * @deprecated
   */
  stopStreaming(): void;

  /**
   * Toggle the streaming state
   */
  toggleStreaming(): Promise<never> | Promise<void>;

  /**
   * @deprecated
   */
  startRecording(): void;

  /**
   * @deprecated
   */
  stopRecording(): void;

  /**
   * Toggle the recording state
   */
  toggleRecording(): void;

  /**
   * Start replay buffer state
   */
  startReplayBuffer(): void;

  /**
   * Stop replay buffer state
   */
  stopReplayBuffer(): void;
}
