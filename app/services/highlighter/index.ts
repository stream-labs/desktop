import {
  mutation,
  ViewHandler,
  Inject,
  InitAfter,
  Service,
  PersistentStatefulService,
} from 'services/core';
import path from 'path';
import Vue from 'vue';
import fs from 'fs-extra';
import url from 'url';
import * as remote from '@electron/remote';
import { EStreamingState, StreamingService } from 'services/streaming';
import { getPlatformService } from 'services/platforms';
import { UserService } from 'services/user';
import {
  IYoutubeVideoUploadOptions,
  IYoutubeUploadResponse,
} from 'services/platforms/youtube/uploader';
import { YoutubeService } from 'services/platforms/youtube';
import os from 'os';
import {
  CLIP_DIR,
  FFMPEG_EXE,
  SCRUB_SPRITE_DIRECTORY,
  SUPPORTED_FILE_TYPES,
  TEST_MODE,
  FFPROBE_EXE,
} from './constants';
import { pmap } from 'util/pmap';
import { RenderingClip } from './clip';
import { AudioCrossfader } from './audio-crossfader';
import { FrameWriter } from './frame-writer';
import { Transitioner } from './transitioner';
import { throttle } from 'lodash-decorators';
import sample from 'lodash/sample';
import { HighlighterError } from './errors';
import { AudioMixer } from './audio-mixer';
import { UsageStatisticsService } from 'services/usage-statistics';
import * as Sentry from '@sentry/browser';
import { $t } from 'services/i18n';
import { DismissablesService, EDismissable } from 'services/dismissables';
import { ENotificationType, NotificationsService } from 'services/notifications';
import { JsonrpcService } from 'services/api/jsonrpc';
import { NavigationService } from 'services/navigation';
import { SharedStorageService } from 'services/integrations/shared-storage';
import execa from 'execa';
import moment from 'moment';
import {
  EHighlighterInputTypes,
  getHighlightClips,
  IHighlight,
  IHighlighterInput,
  ProgressTracker,
} from './ai-highlighter/ai-highlighter';
import uuid from 'uuid';
import { EMenuItemKey } from 'services/side-nav';
import { AiHighlighterUpdater } from './ai-highlighter/updater';
import { IDownloadProgress } from 'util/requests';
import { IncrementalRolloutService } from 'app-services';
import { EAvailableFeatures } from 'services/incremental-rollout';
export type TStreamInfo =
  | {
      orderPosition: number;
      initialStartTime?: number;
      initialEndTime?: number;
    }
  | undefined; // initialTimesInStream

const isAiClip = (clip: TClip): clip is IAiClip => clip.source === 'AiClip';

// types for highlighter video operations
export type TOrientation = 'horizontal' | 'vertical';
export interface ICoordinates {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

interface IBaseClip {
  path: string;
  loaded: boolean;
  enabled: boolean;
  scrubSprite?: string;
  startTrim: number;
  endTrim: number;
  duration?: number;
  deleted: boolean;
  globalOrderPosition: number;
  streamInfo:
    | {
        [streamId: string]: TStreamInfo;
      }
    | undefined;
}
interface IReplayBufferClip extends IBaseClip {
  source: 'ReplayBuffer';
}

interface IManualClip extends IBaseClip {
  source: 'Manual';
}

export interface IAiClip extends IBaseClip {
  source: 'AiClip';
  aiInfo: IAiClipInfo;
}

export interface IDeathMetadata {
  place: number;
}
export interface IKillMetadata {
  bot_kill: boolean;
}

export interface IInput {
  type: EHighlighterInputTypes;
  metadata?: IDeathMetadata | IKillMetadata;
}

export interface IAiClipInfo {
  inputs: IInput[];
  score: number;
  metadata: {
    round: number;
    webcam_coordinates: ICoordinates;
  };
}

export type TClip = IAiClip | IReplayBufferClip | IManualClip;

export enum EHighlighterView {
  CLIPS = 'clips',
  STREAM = 'stream',
  SETTINGS = 'settings',
}

interface TClipsViewState {
  view: EHighlighterView.CLIPS;
  id: string | undefined;
}
interface IStreamViewState {
  view: EHighlighterView.STREAM;
}

interface ISettingsViewState {
  view: EHighlighterView.SETTINGS;
}

export type IViewState = TClipsViewState | IStreamViewState | ISettingsViewState;

// TODO: Need to clean up all of this
export interface StreamInfoForAiHighlighter {
  id: string;
  game: string;
  title?: string;
}

export interface INewClipData {
  path: string;
  aiClipInfo: IAiClipInfo;
  startTime: number;
  endTime: number;
  startTrim: number;
  endTrim: number;
}
export interface IHighlightedStream {
  id: string;
  game: string;
  title: string;
  date: string;
  state: {
    type:
      | 'initialized'
      | 'detection-in-progress'
      | 'error'
      | 'detection-finished'
      | 'detection-canceled-by-user';
    progress: number;
  };
  abortController?: AbortController;
  path: string;
}

export enum EExportStep {
  AudioMix = 'audio',
  FrameRender = 'frames',
}

export type TFPS = 30 | 60;
export type TResolution = 720 | 1080;
export type TPreset = 'ultrafast' | 'fast' | 'slow';

export interface IExportInfo {
  exporting: boolean;
  currentFrame: number;
  totalFrames: number;
  step: EExportStep;
  cancelRequested: boolean;
  file: string;
  previewFile: string;

  /**
   * Whether the export finished successfully.
   * Will be set to false whenever something changes
   * that requires a new export.
   */
  exported: boolean;

  error: string | null;

  fps: TFPS;
  resolution: TResolution;
  preset: TPreset;
}

export interface IUploadInfo {
  uploading: boolean;
  uploadedBytes: number;
  totalBytes: number;
  cancelRequested: boolean;
  videoId: string | null;
  error: boolean;
}

export interface ITransitionInfo {
  type: TTransitionType;
  duration: number;
}

export interface IAudioInfo {
  musicEnabled: boolean;
  musicPath: string;
  musicVolume: number;
}

export interface IIntroInfo {
  path: string;
  duration: number | null;
}
export interface IOutroInfo {
  path: string;
  duration: number | null;
}
export interface IVideoInfo {
  intro: IIntroInfo;
  outro: IOutroInfo;
}

interface IHighlighterState {
  clips: Dictionary<TClip>;
  transition: ITransitionInfo;
  video: IVideoInfo;
  audio: IAudioInfo;
  export: IExportInfo;
  upload: IUploadInfo;
  dismissedTutorial: boolean;
  error: string;
  useAiHighlighter: boolean;
  highlightedStreams: IHighlightedStream[];
  updaterProgress: number;
  isUpdaterRunning: boolean;
  highlighterVersion: string;
}

// Capitalization is not consistent because it matches with the
// gl-transitions library.
export type TTransitionType =
  | 'None'
  | 'Random'
  | 'fade'
  | 'Directional'
  | 'cube'
  | 'crosswarp'
  | 'wind'
  | 'DoomScreenTransition'
  | 'GridFlip'
  | 'Dreamy'
  | 'SimpleZoom'
  | 'pixelize';

export interface IAvailableTransition {
  displayName: string;
  type: TTransitionType;
  params?: { [key: string]: any };
}

const availableTransitions: IAvailableTransition[] = [
  {
    get displayName() {
      return $t('None');
    },
    type: 'None',
  },
  {
    get displayName() {
      return $t('Random');
    },
    type: 'Random',
  },
  {
    get displayName() {
      return $t('Fade');
    },
    type: 'fade',
  },
  {
    get displayName() {
      return $t('Slide');
    },
    type: 'Directional',
    params: { direction: [1, 0] },
  },
  {
    get displayName() {
      return $t('Cube');
    },
    type: 'cube',
  },
  {
    get displayName() {
      return $t('Warp');
    },
    type: 'crosswarp',
  },
  {
    get displayName() {
      return $t('Wind');
    },
    type: 'wind',
  },
  {
    get displayName() {
      return $t("90's Game");
    },
    type: 'DoomScreenTransition',
    params: { bars: 100 },
  },
  {
    get displayName() {
      return $t('Grid Flip');
    },
    type: 'GridFlip',
  },
  {
    get displayName() {
      return $t('Dreamy');
    },
    type: 'Dreamy',
  },
  {
    get displayName() {
      return $t('Zoom');
    },
    type: 'SimpleZoom',
  },
  {
    get displayName() {
      return $t('Pixelize');
    },
    type: 'pixelize',
  },
];

// Avoid having to loop over every time for fast access
const transitionParams: {
  [type in TTransitionType]?: { [key: string]: any };
} = availableTransitions.reduce((params, transition) => {
  return {
    ...params,
    [transition.type]: transition.params,
  };
}, {});

export interface IExportOptions {
  fps: TFPS;
  width: number;
  height: number;
  preset: TPreset;
  complexFilter?: string;
}

class HighlighterViews extends ViewHandler<IHighlighterState> {
  /**
   * Returns an array of clips
   */
  get clips() {
    return Object.values(this.state.clips);
  }
  get clipsDictionary() {
    return this.state.clips;
  }

  /**
   * Returns wether or not the AiHighlighter should be used
   */
  get useAiHighlighter() {
    return this.state.useAiHighlighter;
  }

  /**
   * Returns wether or not the AiHighlighter should be used
   */
  get highlightedStreams() {
    return this.state.highlightedStreams;
  }

  /**
   * Whether any clips need to be loaded
   */
  get loaded() {
    return !this.clips.some(c => !c.loaded);
  }

  get loadedCount() {
    let count = 0;

    this.clips.forEach(c => {
      if (c.loaded) count++;
    });

    return count;
  }

  get exportInfo() {
    return this.state.export;
  }

  get uploadInfo() {
    return this.state.upload;
  }

  get transition() {
    return this.state.transition;
  }

  get audio() {
    return this.state.audio;
  }

  get video() {
    return this.state.video;
  }

  get transitionDuration() {
    return this.transition.type === 'None' ? 0 : this.state.transition.duration;
  }

  get availableTransitions() {
    return availableTransitions;
  }

  get dismissedTutorial() {
    return this.state.dismissedTutorial;
  }

  get error() {
    return this.state.error;
  }

  get highlighterVersion() {
    return this.state.highlighterVersion;
  }

  get isUpdaterRunning() {
    return this.state.isUpdaterRunning;
  }

  get updaterProgress() {
    return this.state.updaterProgress;
  }

  /**
   * Takes a filepath to a video and returns a file:// url with a random
   * component to prevent the browser from caching it and missing changes.
   * @param filePath The path to the video
   */
  getCacheBustingUrl(filePath: string) {
    return `${url.pathToFileURL(filePath).toString()}?time=${Date.now()}`;
  }
}

@InitAfter('StreamingService')
export class HighlighterService extends PersistentStatefulService<IHighlighterState> {
  @Inject() streamingService: StreamingService;
  @Inject() userService: UserService;
  @Inject() usageStatisticsService: UsageStatisticsService;
  @Inject() dismissablesService: DismissablesService;
  @Inject() notificationsService: NotificationsService;
  @Inject() jsonrpcService: JsonrpcService;
  @Inject() navigationService: NavigationService;
  @Inject() sharedStorageService: SharedStorageService;
  @Inject() incrementalRolloutService: IncrementalRolloutService;

  static defaultState: IHighlighterState = {
    clips: {},
    transition: {
      type: 'fade',
      duration: 1,
    },
    video: {
      intro: { path: '', duration: null },
      outro: { path: '', duration: null },
    },
    audio: {
      musicEnabled: false,
      musicPath: '',
      musicVolume: 50,
    },
    export: {
      exporting: false,
      currentFrame: 0,
      totalFrames: 0,
      step: EExportStep.AudioMix,
      cancelRequested: false,
      file: '',
      previewFile: path.join(os.tmpdir(), 'highlighter-preview.mp4'),
      exported: false,
      error: null,
      fps: 30,
      resolution: 720,
      preset: 'ultrafast',
    },
    upload: {
      uploading: false,
      uploadedBytes: 0,
      totalBytes: 0,
      cancelRequested: false,
      videoId: null,
      error: false,
    },
    dismissedTutorial: false,
    error: '',
    useAiHighlighter: false,
    highlightedStreams: [],
    updaterProgress: 0,
    isUpdaterRunning: false,
    highlighterVersion: '',
  };

  aiHighlighterUpdater: AiHighlighterUpdater;
  aiHighlighterEnabled = false;

  static filter(state: IHighlighterState) {
    return {
      ...this.defaultState,
      clips: state.clips,
      highlightedStreams: state.highlightedStreams,
      video: state.video,
      audio: state.audio,
      transition: state.transition,
    };
  }

  /**
   * A dictionary of actual clip classes.
   * These are not serializable so kept out of state.
   */
  renderingClips: Dictionary<RenderingClip> = {};

  directoryCleared = false;

  @mutation()
  ADD_CLIP(clip: TClip) {
    Vue.set(this.state.clips, clip.path, clip);
    this.state.export.exported = false;
  }

  @mutation()
  UPDATE_CLIP(clip: Partial<TClip> & { path: string }) {
    Vue.set(this.state.clips, clip.path, {
      ...this.state.clips[clip.path],
      ...clip,
    });
    this.state.export.exported = false;
  }

  @mutation()
  REMOVE_CLIP(clipPath: string) {
    Vue.delete(this.state.clips, clipPath);
    this.state.export.exported = false;
  }

  @mutation()
  SET_EXPORT_INFO(exportInfo: Partial<IExportInfo>) {
    this.state.export = {
      ...this.state.export,
      exported: false,
      ...exportInfo,
    };
  }

  @mutation()
  SET_UPLOAD_INFO(uploadInfo: Partial<IUploadInfo>) {
    this.state.upload = {
      ...this.state.upload,
      ...uploadInfo,
    };
  }

  @mutation()
  CLEAR_UPLOAD() {
    this.state.upload = {
      uploading: false,
      uploadedBytes: 0,
      totalBytes: 0,
      cancelRequested: false,
      videoId: null,
      error: false,
    };
  }

  @mutation()
  SET_TRANSITION_INFO(transitionInfo: Partial<ITransitionInfo>) {
    this.state.transition = {
      ...this.state.transition,
      ...transitionInfo,
    };
    this.state.export.exported = false;
  }

  @mutation()
  SET_AUDIO_INFO(audioInfo: Partial<IAudioInfo>) {
    this.state.audio = {
      ...this.state.audio,
      ...audioInfo,
    };
    this.state.export.exported = false;
  }

  @mutation()
  SET_VIDEO_INFO(videoInfo: Partial<IVideoInfo>) {
    this.state.video = {
      ...this.state.video,
      ...videoInfo,
    };
    this.state.export.exported = false;
  }

  @mutation()
  DISMISS_TUTORIAL() {
    this.state.dismissedTutorial = true;
  }

  @mutation()
  SET_ERROR(error: string) {
    this.state.error = error;
  }

  @mutation()
  SET_USE_AI_HIGHLIGHTER(useAiHighlighter: boolean) {
    Vue.set(this.state, 'useAiHighlighter', useAiHighlighter);
    this.state.useAiHighlighter = useAiHighlighter;
  }

  @mutation()
  ADD_HIGHLIGHTED_STREAM(streamInfo: IHighlightedStream) {
    // Vue.set(this.state, 'highlightedStreams', streamInfo);
    this.state.highlightedStreams.push(streamInfo);
  }

  @mutation()
  UPDATE_HIGHLIGHTED_STREAM(updatedStreamInfo: IHighlightedStream) {
    const keepAsIs = this.state.highlightedStreams.filter(
      stream => stream.id !== updatedStreamInfo.id,
    );
    this.state.highlightedStreams = [...keepAsIs, updatedStreamInfo];
  }

  @mutation()
  REMOVE_HIGHLIGHTED_STREAM(id: string) {
    this.state.highlightedStreams = this.state.highlightedStreams.filter(
      stream => stream.id !== id,
    );
  }

  @mutation()
  SET_UPDATER_PROGRESS(progress: number) {
    this.state.updaterProgress = progress;
  }

  @mutation()
  SET_UPDATER_STATE(isRunning: boolean) {
    this.state.isUpdaterRunning = isRunning;
  }

  @mutation()
  SET_HIGHLIGHTER_VERSION(version: string) {
    this.state.highlighterVersion = version;
  }

  get views() {
    return new HighlighterViews(this.state);
  }

  async init() {
    super.init();
    this.aiHighlighterEnabled = this.incrementalRolloutService.views.featureIsEnabled(
      EAvailableFeatures.aiHighlighter,
    );

    if (this.aiHighlighterEnabled && !this.aiHighlighterUpdater) {
      this.aiHighlighterUpdater = new AiHighlighterUpdater();
    }

    // check if ai highlighter is activated and we need to update it
    if (
      this.aiHighlighterEnabled &&
      this.views.useAiHighlighter &&
      (await this.aiHighlighterUpdater.isNewVersionAvailable())
    ) {
      await this.startUpdater();
    }

    //
    this.views.clips.forEach(clip => {
      if (isAiClip(clip) && (clip.aiInfo as any).moments) {
        clip.aiInfo.inputs = (clip.aiInfo as any).moments;
        delete (clip.aiInfo as any).moments;
      }
    });

    //Check if files are existent, if not, delete
    this.views.clips.forEach(c => {
      if (!this.fileExists(c.path)) {
        this.removeClip(c.path, undefined);
      }
    });

    if (this.views.exportInfo.exporting) {
      this.SET_EXPORT_INFO({
        exporting: false,
        error: null,
        cancelRequested: false,
      });
    }

    //Check if aiDetections were still running when the user closed desktop
    this.views.highlightedStreams
      .filter(stream => stream.state.type === 'detection-in-progress')
      .forEach(stream => {
        this.UPDATE_HIGHLIGHTED_STREAM({
          ...stream,
          state: { type: 'detection-canceled-by-user', progress: 0 },
        });
      });

    this.views.clips.forEach(c => {
      this.UPDATE_CLIP({
        path: c.path,
        loaded: false,
      });
    });

    try {
      // On some very very small number of systems, we won't be able to fetch
      // the videos path from the system.
      // TODO: Add a fallback directory?
      this.SET_EXPORT_INFO({
        file: path.join(remote.app.getPath('videos'), 'Output.mp4'),
      });
    } catch (e: unknown) {
      console.error('Got error fetching videos directory', e);
    }

    if (TEST_MODE) {
      const clipsToLoad = [
        // Aero 15 test clips
        // path.join(CLIP_DIR, '2021-05-12 12-59-28.mp4'),
        path.join(CLIP_DIR, 'Replay 2021-03-30 14-13-20.mp4'),
        // path.join(CLIP_DIR, 'Replay 2021-03-30 14-13-29.mp4'),
        // path.join(CLIP_DIR, 'Replay 2021-03-30 14-13-41.mp4'),
        // path.join(CLIP_DIR, 'Replay 2021-03-30 14-13-49.mp4'),
        // path.join(CLIP_DIR, 'Replay 2021-03-30 14-13-58.mp4'),
        // path.join(CLIP_DIR, 'Replay 2021-03-30 14-14-03.mp4'),
        // path.join(CLIP_DIR, 'Replay 2021-03-30 14-14-06.mp4'),
        // path.join(CLIP_DIR, 'Replay 2021-03-30 14-30-53.mp4'),
        path.join(CLIP_DIR, 'Replay 2021-03-30 14-32-34.mp4'),
        // path.join(CLIP_DIR, 'Replay 2021-03-30 14-34-33.mp4'),
        // path.join(CLIP_DIR, 'Replay 2021-03-30 14-34-48.mp4'),
        // path.join(CLIP_DIR, 'Replay 2021-03-30 14-35-03.mp4'),
        // path.join(CLIP_DIR, 'Replay 2021-03-30 14-35-23.mp4'),
        // path.join(CLIP_DIR, 'Replay 2021-03-30 14-35-51.mp4'),
        // path.join(CLIP_DIR, 'Replay 2021-03-30 14-36-18.mp4'),
        // path.join(CLIP_DIR, 'Replay 2021-03-30 14-36-30.mp4'),
        // path.join(CLIP_DIR, 'Replay 2021-03-30 14-36-44.mp4'),

        // Spoken Audio
        path.join(CLIP_DIR, '2021-06-24 13-59-58.mp4'),
        // path.join(CLIP_DIR, '2021-06-24 14-00-26.mp4'),
        // path.join(CLIP_DIR, '2021-06-24 14-00-52.mp4'),

        // 60 FPS
        path.join(CLIP_DIR, '2021-07-06 15-14-22.mp4'),

        // Razer blade test clips
        // path.join(CLIP_DIR, '2021-05-25 08-55-13.mp4'),
        // path.join(CLIP_DIR, '2021-06-08 16-40-14.mp4'),
        // path.join(CLIP_DIR, '2021-05-25 08-56-03.mp4'),
      ];

      //  await this.addStream({
      //  id: 'demo123',
      // game: 'Fortnite',
      //title: 'Demo Stream',
      //date: '1726234396290',
      //state: { type: 'detection-finished', progress: 0 },
      //});
      //const newClips = [getSharedResource('replay123.mp4')].map(path => ({ path }));
      //this.addClips(newClips, 'demo123', 'Manual');
    } else {
      let streamStarted = false;
      let aiRecordingInProgress = false;
      let aiRecordingStartTime = moment();
      let streamInfo: StreamInfoForAiHighlighter;

      this.streamingService.replayBufferFileWrite.subscribe(async clipPath => {
        const streamId = streamInfo?.id || undefined;
        let endTime: number;

        if (streamId) {
          endTime = moment().diff(aiRecordingStartTime, 'seconds');
        } else {
          endTime = undefined;
        }

        const REPLAY_BUFFER_DURATION = 20; // TODO M: Replace with settingsservice
        const startTime = Math.max(0, endTime ? endTime - REPLAY_BUFFER_DURATION : 0);

        this.addClips([{ path: clipPath, startTime, endTime }], streamId, 'ReplayBuffer');
      });

      this.streamingService.streamingStatusChange.subscribe(async status => {
        if (status === EStreamingState.Live) {
          streamStarted = true; // console.log('live', this.streamingService.views.settings.platforms.twitch.title);

          if (this.views.useAiHighlighter === false) {
            console.log('HighlighterService: Game:', this.streamingService.views.game);
            // console.log('Highlighter not enabled or not Fortnite');
            return;
          }

          // console.log('recording Alreadyt running?:', this.streamingService.views.isRecording);

          if (this.streamingService.views.isRecording) {
            // console.log('Recording is already running');
          } else {
            this.streamingService.toggleRecording();
          }
          streamInfo = {
            id: 'fromStreamRecording' + uuid(),
            title: this.streamingService.views.settings.platforms.twitch.title,
            game: this.streamingService.views.game,
          };
          aiRecordingInProgress = true;
          aiRecordingStartTime = moment();
        }

        if (status === EStreamingState.Offline) {
          if (
            streamStarted &&
            this.views.clips.length > 0 &&
            this.dismissablesService.views.shouldShow(EDismissable.HighlighterNotification)
          ) {
            this.notificationsService.push({
              type: ENotificationType.SUCCESS,
              lifeTime: -1,
              message: $t(
                'Edit your replays with Highlighter, a free editor built in to Streamlabs.',
              ),
              action: this.jsonrpcService.createRequest(
                Service.getResourceId(this),
                'notificationAction',
              ),
            });

            this.usageStatisticsService.recordAnalyticsEvent(
              this.views.useAiHighlighter ? 'AIHighlighter' : 'Highlighter',
              {
                type: 'NotificationShow',
              },
            );
          }

          streamStarted = false;
        }
        if (status === EStreamingState.Ending) {
          if (!aiRecordingInProgress) {
            return;
          }
          this.streamingService.toggleRecording();

          // Load potential replaybuffer clips
          await this.loadClips(streamInfo.id);
        }
      });

      this.streamingService.latestRecordingPath.subscribe(path => {
        if (!aiRecordingInProgress) {
          return;
        }

        aiRecordingInProgress = false;
        this.flow(path, streamInfo);

        this.navigationService.actions.navigate(
          'Highlighter',
          { view: 'stream' },
          EMenuItemKey.Highlighter,
        );
      });
    }
  }

  notificationAction() {
    this.navigationService.navigate('Highlighter');
    this.dismissablesService.dismiss(EDismissable.HighlighterNotification);
    this.usageStatisticsService.recordAnalyticsEvent(
      this.views.useAiHighlighter ? 'AIHighlighter' : 'Highlighter',
      {
        type: 'NotificationClick',
      },
    );
  }

  addClips(
    newClips: { path: string; startTime?: number; endTime?: number }[],
    streamId: string | undefined,
    source: 'Manual' | 'ReplayBuffer',
  ) {
    newClips.forEach((clipData, index) => {
      const currentClips = this.getClips(this.views.clips, streamId);
      const getHighestGlobalOrderPosition = this.getClips(this.views.clips, undefined).length;

      let newStreamInfo: { [key: string]: TStreamInfo };
      if (source === 'Manual') {
        if (streamId) {
          currentClips.forEach(clip => {
            const updatedStreamInfo = {
              ...clip.streamInfo,
              [streamId]: {
                ...clip.streamInfo[streamId],
                orderPosition: clip.streamInfo[streamId].orderPosition + 1,
              },
            };
            this.UPDATE_CLIP({
              path: clip.path,
              streamInfo: updatedStreamInfo,
            });
          });
        }
        newStreamInfo = {
          [streamId]: {
            orderPosition: 0,
          },
        };
      } else {
        newStreamInfo = {
          [streamId]: {
            orderPosition: index + currentClips.length + 1,
            initialStartTime: clipData.startTime,
            initialEndTime: clipData.endTime,
          },
        };
      }

      if (this.state.clips[clipData.path]) {
        const updatedStreamInfo = {
          ...this.state.clips[clipData.path].streamInfo,
          ...newStreamInfo,
        };

        this.UPDATE_CLIP({
          path: clipData.path,
          streamInfo: updatedStreamInfo,
        });
        return;
      } else {
        this.ADD_CLIP({
          path: clipData.path,
          loaded: false,
          enabled: true,
          startTrim: 0,
          endTrim: 0,
          deleted: false,
          source,
          globalOrderPosition: index + getHighestGlobalOrderPosition + 1,
          streamInfo: streamId !== undefined ? newStreamInfo : undefined,
        });
      }
    });
    return;
  }

  async addAiClips(newClips: INewClipData[], newStreamInfo: StreamInfoForAiHighlighter) {
    const currentHighestOrderPosition = this.getClips(this.views.clips, newStreamInfo.id).length;
    const getHighestGlobalOrderPosition = this.getClips(this.views.clips, undefined).length;

    newClips.forEach((clip, index) => {
      // Don't allow adding the same clip twice for ai clips
      if (this.state.clips[clip.path]) return;

      const streamInfo: { [key: string]: TStreamInfo } = {
        [newStreamInfo.id]: {
          orderPosition: index + currentHighestOrderPosition + 1,
          initialStartTime: clip.startTime,
          initialEndTime: clip.endTime,
        },
      };

      this.ADD_CLIP({
        path: clip.path,
        loaded: false,
        enabled: true,
        startTrim: clip.startTrim,
        endTrim: clip.endTrim,
        deleted: false,
        source: 'AiClip',
        aiInfo: clip.aiClipInfo,
        globalOrderPosition: index + getHighestGlobalOrderPosition + 1,
        streamInfo,
      });
    });
    this.sortStreamClipsByStartTime(this.views.clips, newStreamInfo);
    await this.loadClips(newStreamInfo.id);
  }

  sortStreamClipsByStartTime(clips: TClip[], newStreamInfo: StreamInfoForAiHighlighter) {
    const allClips = this.getClips(clips, newStreamInfo.id);

    const sortedClips = allClips.sort(
      (a, b) =>
        a.streamInfo[newStreamInfo.id].initialStartTime -
        b.streamInfo[newStreamInfo.id].initialStartTime,
    );

    // Update order positions based on the sorted order
    sortedClips.forEach((clip, index) => {
      this.UPDATE_CLIP({
        path: clip.path,
        streamInfo: {
          [newStreamInfo.id]: {
            ...clip.streamInfo[newStreamInfo.id],
            orderPosition: index + 1,
          },
        },
      });
    });
  }

  enableClip(path: string, enabled: boolean) {
    this.UPDATE_CLIP({
      path,
      enabled,
    });
  }
  disableClip(path: string) {
    this.UPDATE_CLIP({
      path,
      enabled: false,
    });
  }

  setStartTrim(path: string, trim: number) {
    this.UPDATE_CLIP({
      path,
      startTrim: trim,
    });
  }

  setEndTrim(path: string, trim: number) {
    this.UPDATE_CLIP({
      path,
      endTrim: trim,
    });
  }

  removeClip(path: string, streamId: string | undefined) {
    const clip: TClip = this.state.clips[path];
    if (!clip) {
      console.warn(`Clip not found for path: ${path}`);
      return;
    }
    if (
      this.fileExists(path) &&
      streamId &&
      clip.streamInfo &&
      Object.keys(clip.streamInfo).length > 1
    ) {
      const updatedStreamInfo = { ...clip.streamInfo };
      delete updatedStreamInfo[streamId];

      this.UPDATE_CLIP({
        path: clip.path,
        streamInfo: updatedStreamInfo,
      });
    } else {
      this.REMOVE_CLIP(path);
      this.removeScrubFile(clip.scrubSprite);
      delete this.renderingClips[path];
    }

    if (clip.streamInfo !== undefined || streamId !== undefined) {
      const ids: string[] = streamId ? [streamId] : Object.keys(clip.streamInfo);
      const length = this.views.clips.length;

      ids.forEach(id => {
        let found = false;
        if (length !== 0) {
          for (let i = 0; i < length; i++) {
            if (this.views.clips[i].streamInfo?.[id] !== undefined) {
              found = true;
              break;
            }
          }
        }
        if (!found) {
          this.REMOVE_HIGHLIGHTED_STREAM(id);
        }
      });
    }
  }

  setTransition(transition: Partial<ITransitionInfo>) {
    this.SET_TRANSITION_INFO(transition);
  }

  setAudio(audio: Partial<IAudioInfo>) {
    this.SET_AUDIO_INFO(audio);
  }

  setVideo(video: Partial<IVideoInfo>) {
    this.SET_VIDEO_INFO(video);
  }

  setExportFile(file: string) {
    this.SET_EXPORT_INFO({ file });
  }

  setFps(fps: TFPS) {
    this.SET_EXPORT_INFO({ fps });
  }

  setResolution(resolution: TResolution) {
    this.SET_EXPORT_INFO({ resolution });
  }

  setPreset(preset: TPreset) {
    this.SET_EXPORT_INFO({ preset });
  }

  dismissError() {
    if (this.state.export.error) this.SET_EXPORT_INFO({ error: null });
    if (this.state.upload.error) this.SET_UPLOAD_INFO({ error: false });
    if (this.state.error) this.SET_ERROR('');
  }

  dismissTutorial() {
    this.DISMISS_TUTORIAL();
  }

  fileExists(file: string): boolean {
    return fs.existsSync(file);
  }

  // TODO M: Temp way to solve the issue
  addStream(streamInfo: IHighlightedStream) {
    return new Promise<void>(resolve => {
      this.ADD_HIGHLIGHTED_STREAM(streamInfo);
      setTimeout(() => {
        resolve();
      }, 2000);
    });
  }

  updateStream(streamInfo: IHighlightedStream) {
    this.UPDATE_HIGHLIGHTED_STREAM(streamInfo);
  }

  removeStream(streamId: string) {
    this.REMOVE_HIGHLIGHTED_STREAM(streamId);

    //Remove clips from stream
    const clipsToRemove = this.getClips(this.views.clips, streamId);
    clipsToRemove.forEach(clip => {
      this.removeClip(clip.path, streamId);
    });
  }

  async removeScrubFile(clipPath: string) {
    try {
      await fs.remove(clipPath);
    } catch (error: unknown) {
      console.error('Error removing scrub file', error);
    }
  }

  setAiHighlighter(state: boolean) {
    this.SET_USE_AI_HIGHLIGHTER(state);
    this.usageStatisticsService.recordAnalyticsEvent('AIHighlighter', {
      type: 'Toggled',
      value: state,
    });
  }

  toggleAiHighlighter() {
    if (this.state.useAiHighlighter) {
      this.SET_USE_AI_HIGHLIGHTER(false);
    } else {
      this.SET_USE_AI_HIGHLIGHTER(true);
    }
  }

  async loadClips(streamInfoId?: string | undefined) {
    const clipsToLoad: TClip[] = this.getClips(this.views.clips, streamInfoId);
    // this.resetRenderingClips();
    await this.ensureScrubDirectory();

    for (const clip of clipsToLoad) {
      if (!this.fileExists(clip.path)) {
        this.removeClip(clip.path, streamInfoId);
        return;
      }

      if (!SUPPORTED_FILE_TYPES.map(e => `.${e}`).includes(path.parse(clip.path).ext)) {
        this.removeClip(clip.path, streamInfoId);
        this.SET_ERROR(
          $t(
            'One or more clips could not be imported because they were not recorded in a supported file format.',
          ),
        );
      }

      this.renderingClips[clip.path] =
        this.renderingClips[clip.path] ?? new RenderingClip(clip.path);
    }

    //TODO M: tracking type not correct
    await pmap(
      clipsToLoad.filter(c => !c.loaded),
      c => this.renderingClips[c.path].init(),
      {
        concurrency: os.cpus().length,
        onProgress: completed => {
          this.usageStatisticsService.recordAnalyticsEvent(
            this.views.useAiHighlighter ? 'AIHighlighter' : 'Highlighter',
            {
              type: 'ClipImport',
              source: completed.source,
            },
          );
          this.UPDATE_CLIP({
            path: completed.path,
            loaded: true,
            scrubSprite: this.renderingClips[completed.path].frameSource?.scrubJpg,
            duration: this.renderingClips[completed.path].duration,
            deleted: this.renderingClips[completed.path].deleted,
          });
        },
      },
    );
    return;
  }

  resetRenderingClips() {
    this.renderingClips = {};
  }

  private async ensureScrubDirectory() {
    try {
      try {
        //If possible to read, directory exists, if not, catch and mkdir
        await fs.readdir(SCRUB_SPRITE_DIRECTORY);
      } catch (error: unknown) {
        await fs.mkdir(SCRUB_SPRITE_DIRECTORY);
      }
    } catch (error: unknown) {
      console.log('Error creating scrub sprite directory');
    }
  }

  cancelExport() {
    this.SET_EXPORT_INFO({ cancelRequested: true });
  }

  /**
   * Exports the video using the currently configured settings
   * Return true if the video was exported, or false if not.
   */
  async export(
    preview = false,
    streamId: string | undefined = undefined,
    orientation: TOrientation = 'horizontal',
  ) {
    await this.loadClips(streamId);

    if (
      !this.views.clips
        .filter(c => {
          if (!c.enabled) return false;
          if (!streamId) return true;
          return c.streamInfo && c.streamInfo[streamId] !== undefined;
        })
        .every(clip => clip.loaded)
    ) {
      console.error('Highlighter: Export called while clips are not fully loaded!: ');
      return;
    }

    if (this.views.exportInfo.exporting) {
      console.error('Highlighter: Cannot export until current export operation is finished');
      return;
    }

    let renderingClips: RenderingClip[] = [];
    if (streamId) {
      renderingClips = this.getClips(this.views.clips, streamId)
        .filter(clip => clip.enabled && clip.streamInfo && clip.streamInfo[streamId] !== undefined)
        .sort(
          (a: TClip, b: TClip) =>
            a.streamInfo[streamId].orderPosition - b.streamInfo[streamId].orderPosition,
        )
        .map(c => {
          const clip = this.renderingClips[c.path];

          clip.startTrim = c.startTrim;
          clip.endTrim = c.endTrim;

          return clip;
        });
    } else {
      renderingClips = this.views.clips
        .filter(c => c.enabled)
        .sort((a: TClip, b: TClip) => a.globalOrderPosition - b.globalOrderPosition)
        .map(c => {
          const clip = this.renderingClips[c.path];

          clip.startTrim = c.startTrim;
          clip.endTrim = c.endTrim;

          return clip;
        });
    }

    if (this.views.video.intro.path && orientation !== 'vertical') {
      const intro: RenderingClip = new RenderingClip(this.views.video.intro.path);
      await intro.init();
      intro.startTrim = 0;
      intro.endTrim = 0;
      renderingClips.unshift(intro);
    }
    if (this.views.video.outro.path && orientation !== 'vertical') {
      const outro = new RenderingClip(this.views.video.outro.path);
      await outro.init();
      outro.startTrim = 0;
      outro.endTrim = 0;
      renderingClips.push(outro);
    }

    const exportOptions: IExportOptions = preview
      ? { width: 1280 / 4, height: 720 / 4, fps: 30, preset: 'ultrafast' }
      : {
          width: this.views.exportInfo.resolution === 720 ? 1280 : 1920,
          height: this.views.exportInfo.resolution === 720 ? 720 : 1080,
          fps: this.views.exportInfo.fps,
          preset: this.views.exportInfo.preset,
        };

    if (orientation === 'vertical') {
      // adds complex filter and flips width and height
      this.addVerticalFilterToExportOptions(exportOptions);
    }

    // Reset all clips
    await pmap(renderingClips, c => c.reset(exportOptions), {
      onProgress: c => {
        if (c.deleted) {
          this.UPDATE_CLIP({ path: c.sourcePath, deleted: true });
        }
      },
    });

    // TODO: For now, just remove deleted clips from the video
    // In the future, abort export and surface error to the user.
    renderingClips = renderingClips.filter(c => !c.deleted);

    if (!renderingClips.length) {
      console.error('Highlighter: Export called without any clips!');
      return;
    }

    // Estimate the total number of frames to set up export info
    const totalFrames = renderingClips.reduce((count: number, clip) => {
      return count + clip.frameSource.nFrames;
    }, 0);
    const numTransitions = renderingClips.length - 1;
    const transitionFrames = this.views.transitionDuration * exportOptions.fps;
    const totalFramesAfterTransitions = totalFrames - numTransitions * transitionFrames;

    this.SET_EXPORT_INFO({
      exporting: true,
      currentFrame: 0,
      totalFrames: totalFramesAfterTransitions,
      step: EExportStep.AudioMix,
      cancelRequested: false,
      error: null,
    });

    let fader: AudioCrossfader | null = null;
    let mixer: AudioMixer | null = null;

    try {
      let currentFrame = 0;

      // Mix audio first
      await Promise.all(
        renderingClips.filter(c => c.hasAudio).map(clip => clip.audioSource.extract()),
      );
      const parsed = path.parse(this.views.exportInfo.file);
      const audioConcat = path.join(parsed.dir, `${parsed.name}-concat.flac`);
      let audioMix = path.join(parsed.dir, `${parsed.name}-mix.flac`);
      fader = new AudioCrossfader(audioConcat, renderingClips, this.views.transitionDuration);
      await fader.export();

      if (this.views.audio.musicEnabled && this.views.audio.musicPath) {
        mixer = new AudioMixer(audioMix, [
          { path: audioConcat, volume: 1, loop: false },
          {
            path: this.views.audio.musicPath,
            volume: Math.pow(10, -1 + this.views.audio.musicVolume / 100),
            loop: true,
          },
        ]);

        await mixer.export();
      } else {
        // If there's no background music, we can skip mix entirely and just
        // use the concatenated clip audio directly.
        audioMix = audioConcat;
      }

      await Promise.all(renderingClips.map(clip => clip.audioSource.cleanup()));
      const nClips = renderingClips.length;

      this.SET_EXPORT_INFO({ step: EExportStep.FrameRender });

      // Cannot be null because we already checked there is at least 1 element in the array
      let fromClip = renderingClips.shift()!;
      let toClip = renderingClips.shift();

      let transitioner: Transitioner | null = null;
      const exportPath = preview ? this.views.exportInfo.previewFile : this.views.exportInfo.file;
      const writer = new FrameWriter(
        exportPath,
        audioMix,
        totalFramesAfterTransitions / exportOptions.fps,
        exportOptions,
      );

      while (true) {
        if (this.views.exportInfo.cancelRequested) {
          if (fromClip) fromClip.frameSource.end();
          if (toClip) toClip.frameSource.end();
          await writer.end();
          break;
        }

        const fromFrameRead = await fromClip.frameSource.readNextFrame();

        // Sometimes we get one less frame than we expect.
        // When this happens, we just pad in an extra frame that is
        // the same as the previous frame
        if (!fromFrameRead && fromClip.frameSource.currentFrame < fromClip.frameSource.nFrames) {
          // The read buffer should still be valid, so just increment the counter
          console.debug('Padding with repeated frame');
          fromClip.frameSource.currentFrame++;
        }

        const actualTransitionFrames = Math.min(
          transitionFrames,
          (fromClip.frameSource.trimmedDuration / 2) * exportOptions.fps,
          toClip ? (toClip.frameSource.trimmedDuration / 2) * exportOptions.fps : Infinity,
        );

        const inTransition =
          fromClip.frameSource.currentFrame > fromClip.frameSource.nFrames - actualTransitionFrames;
        let frameToRender: Buffer | null;

        if (inTransition && toClip && actualTransitionFrames !== 0) {
          await toClip.frameSource.readNextFrame();

          if (!transitioner) {
            if (this.views.transition.type === 'Random') {
              const type = sample(
                availableTransitions.filter(t => !['None', 'Random'].includes(t.type)),
              )!.type;
              transitioner = new Transitioner(type, transitionParams[type], exportOptions);
            } else {
              transitioner = new Transitioner(
                this.state.transition.type,
                transitionParams[this.state.transition.type],
                exportOptions,
              );
            }
          }

          transitioner.renderTransition(
            fromClip.frameSource.readBuffer,
            toClip.frameSource.readBuffer,

            // Frame counter refers to next frame we will read
            // Subtract 1 to get the frame we just read
            (toClip.frameSource.currentFrame - 1) / actualTransitionFrames,
          );
          frameToRender = transitioner.getFrame();
        } else {
          frameToRender = fromClip.frameSource.readBuffer;
        }

        // Write the next frame
        if (frameToRender) {
          await writer.writeNextFrame(frameToRender);
          currentFrame++;
          this.setCurrentFrame(currentFrame);
        }

        // Check if the currently playing clip ended
        if (fromClip.frameSource.currentFrame === fromClip.frameSource.nFrames || !frameToRender) {
          // Reset the transitioner so a new one is selected at random
          if (this.views.transition.type === 'Random') transitioner = null;
          fromClip.frameSource.end();
          fromClip = toClip!;
          toClip = renderingClips.shift();
        }

        if (!fromClip) {
          console.log('Out of sources, closing file');
          await writer.end();
          console.debug(
            `Export complete - Expected Frames: ${this.views.exportInfo.totalFrames} Actual Frames: ${currentFrame}`,
          );

          this.usageStatisticsService.recordAnalyticsEvent(
            this.views.useAiHighlighter ? 'AIHighlighter' : 'Highlighter',
            {
              type: 'ExportComplete',
              numClips: nClips,
              totalClips: this.views.clips.length,
              transition: this.views.transition.type,
              transitionDuration: this.views.transition.duration,
              resolution: this.views.exportInfo.resolution,
              fps: this.views.exportInfo.fps,
              preset: this.views.exportInfo.preset,
              duration: totalFramesAfterTransitions / exportOptions.fps,
              isPreview: preview,
            },
          );
          break;
        }
      }
    } catch (e: unknown) {
      console.error(e);

      Sentry.withScope(scope => {
        scope.setTag('feature', 'highlighter');
        console.error('Highlighter export error', e);
      });

      if (e instanceof HighlighterError) {
        this.SET_EXPORT_INFO({ error: e.userMessage });
        this.usageStatisticsService.recordAnalyticsEvent(
          this.views.useAiHighlighter ? 'AIHighlighter' : 'Highlighter',
          {
            type: 'ExportError',
            error: e.constructor.name,
          },
        );
      } else {
        this.SET_EXPORT_INFO({ error: $t('An error occurred while exporting the video') });
        this.usageStatisticsService.recordAnalyticsEvent(
          this.views.useAiHighlighter ? 'AIHighlighter' : 'Highlighter',
          {
            type: 'ExportError',
            error: 'Unknown',
          },
        );
      }
    }

    if (fader) await fader.cleanup();
    if (mixer) await mixer.cleanup();
    // this.resetRenderingClips();
    this.SET_EXPORT_INFO({
      exporting: false,
      exported: !this.views.exportInfo.cancelRequested && !preview && !this.views.exportInfo.error,
    });
    this.SET_UPLOAD_INFO({ videoId: null });
  }

  /**
   *
   * @param exportOptions export options to be modified
   * Take the existing export options, flips the resolution to vertical and adds complex filter to move webcam to top
   */
  private addVerticalFilterToExportOptions(exportOptions: IExportOptions) {
    const webcamCoordinates = this.getWebcamPosition();
    const newWidth = exportOptions.height;
    const newHeight = exportOptions.width;
    // exportOptions.height = exportOptions.width;
    // exportOptions.width = newWidth;
    exportOptions.complexFilter = this.getWebcamComplexFilterForFfmpeg(
      webcamCoordinates,
      newWidth,
      newHeight,
    );
  }
  /**
   *
   * @param
   * @returns
   * Gets the first webcam position from all of the clips
   * should get webcam position for a specific clip soon
   */
  private getWebcamPosition() {
    const clipWithWebcam = this.views.clips.find(
      clip =>
        isAiClip(clip) &&
        !!clip?.aiInfo?.metadata?.webcam_coordinates &&
        this.renderingClips[clip.path],
    ) as IAiClip;
    return clipWithWebcam?.aiInfo?.metadata?.webcam_coordinates || undefined;
  }
  /**
   *
   * @param webcamCoordinates
   * @param outputWidth
   * @param outputHeight
   * @returns properly formatted complex filter for ffmpeg to move webcam to top in vertical video
   */
  private getWebcamComplexFilterForFfmpeg(
    webcamCoordinates: ICoordinates | null,
    outputWidth: number,
    outputHeight: number,
  ) {
    if (!webcamCoordinates) {
      return `
      [0:v]crop=ih*${outputWidth}/${outputHeight}:ih,scale=${outputWidth}:-1:force_original_aspect_ratio=increase[final];
      `;
    }

    const webcamTopX = webcamCoordinates?.x1;
    const webcamTopY = webcamCoordinates?.y1;
    const webcamWidth = webcamCoordinates?.x2 - webcamCoordinates?.x1;
    const webcamHeight = webcamCoordinates?.y2 - webcamCoordinates?.y1;

    const oneThirdHeight = outputHeight / 3;
    const twoThirdsHeight = (outputHeight * 2) / 3;

    return `
    [0:v]split=3[webcam][vid][blur_source];
    color=c=black:s=${outputWidth}x${outputHeight}:d=1[base];
    [webcam]crop=w=${webcamWidth}:h=${webcamHeight}:x=${webcamTopX}:y=${webcamTopY},scale=-1:${oneThirdHeight}[webcam_final];
    [vid]crop=ih*${outputWidth}/${twoThirdsHeight}:ih,scale=${outputWidth}:${twoThirdsHeight}[vid_cropped];
    [blur_source]crop=ih*${outputWidth}/${twoThirdsHeight}:ih,scale=${outputWidth}:${oneThirdHeight},gblur=sigma=50[blur];
    [base][blur]overlay=x=0:y=0[blur_base];
    [blur_base][webcam_final]overlay='(${outputWidth}-overlay_w)/2:(${oneThirdHeight}-overlay_h)/2'[base_webcam];
    [base_webcam][vid_cropped]overlay=x=0:y=${oneThirdHeight}[final];
    `;
  }

  // We throttle because this can go extremely fast, especially on previews
  @throttle(100)
  private setCurrentFrame(frame: number) {
    // Avoid a race condition where we reset the exported flag
    if (this.views.exportInfo.exported) return;
    this.SET_EXPORT_INFO({ currentFrame: frame });
  }

  cancelFunction: (() => void) | null = null;

  async uploadYoutube(options: IYoutubeVideoUploadOptions) {
    if (!this.userService.state.auth?.platforms.youtube) {
      throw new Error('Cannot upload without YT linked');
    }

    if (!this.views.exportInfo.exported) {
      throw new Error('Cannot upload when export is not complete');
    }

    if (this.views.uploadInfo.uploading) {
      throw new Error('Cannot start a new upload when uploading is in progress');
    }

    this.SET_UPLOAD_INFO({ uploading: true, cancelRequested: false, error: false });

    const yt = getPlatformService('youtube') as YoutubeService;

    const { cancel, complete } = yt.uploader.uploadVideo(
      this.views.exportInfo.file,
      options,
      progress => {
        this.SET_UPLOAD_INFO({
          uploadedBytes: progress.uploadedBytes,
          totalBytes: progress.totalBytes,
        });
      },
    );

    this.cancelFunction = cancel;
    let result: IYoutubeUploadResponse | null = null;

    try {
      result = await complete;
    } catch (e: unknown) {
      if (this.views.uploadInfo.cancelRequested) {
        console.log('The upload was canceled');
      } else {
        Sentry.withScope(scope => {
          scope.setTag('feature', 'highlighter');
          console.error('Got error uploading YT video', e);
        });

        this.SET_UPLOAD_INFO({ error: true });
        this.usageStatisticsService.recordAnalyticsEvent(
          this.views.useAiHighlighter ? 'AIHighlighter' : 'Highlighter',
          {
            type: 'UploadYouTubeError',
          },
        );
      }
    }

    this.cancelFunction = null;
    this.SET_UPLOAD_INFO({
      uploading: false,
      cancelRequested: false,
      videoId: result ? result.id : null,
    });

    if (result) {
      this.usageStatisticsService.recordAnalyticsEvent(
        this.views.useAiHighlighter ? 'AIHighlighter' : 'Highlighter',
        {
          type: 'UploadYouTubeSuccess',
          privacy: options.privacyStatus,
          videoLink:
            options.privacyStatus === 'public'
              ? `https://youtube.com/watch?v=${result.id}`
              : undefined,
        },
      );
    }
  }

  async uploadStorage(platform: string) {
    this.SET_UPLOAD_INFO({ uploading: true, cancelRequested: false, error: false });

    const { cancel, complete, size } = await this.sharedStorageService.actions.return.uploadFile(
      this.views.exportInfo.file,
      progress => {
        this.SET_UPLOAD_INFO({
          uploadedBytes: progress.uploadedBytes,
          totalBytes: progress.totalBytes,
        });
      },
      error => {
        this.SET_UPLOAD_INFO({ error: true });
        console.error(error);
      },
    );
    this.cancelFunction = cancel;
    let id;
    try {
      const result = await complete;
      id = result.id;
    } catch (e: unknown) {
      if (this.views.uploadInfo.cancelRequested) {
        console.log('The upload was canceled');
      } else {
        this.SET_UPLOAD_INFO({ uploading: false, error: true });
        this.usageStatisticsService.recordAnalyticsEvent('Highlighter', {
          type: 'UploadStorageError',
          fileSize: size,
          platform,
        });
      }
    }
    this.cancelFunction = null;
    this.SET_UPLOAD_INFO({ uploading: false, cancelRequested: false, videoId: id || null });

    if (id) {
      this.usageStatisticsService.recordAnalyticsEvent('Highlighter', {
        type: 'UploadStorageSuccess',
        fileSize: size,
        platform,
      });
    }

    return id;
  }

  /**
   * Will cancel the currently in progress upload
   */
  cancelUpload() {
    if (this.cancelFunction && this.views.uploadInfo.uploading) {
      this.SET_UPLOAD_INFO({ cancelRequested: true });
      this.cancelFunction();
    }
  }

  clearUpload() {
    this.CLEAR_UPLOAD();
  }

  extractDateTimeFromPath(filePath: string): string | undefined {
    try {
      const parts = filePath.split(/[/\\]/);
      const fileName = parts[parts.length - 1];
      const dateTimePart = fileName.split('.')[0];
      return dateTimePart;
    } catch (error: unknown) {
      return undefined;
    }
  }

  restartAiDetection(filePath: string, streamInfo: IHighlightedStream) {
    this.removeStream(streamInfo.id);
    const streamInfoForHighlighter: StreamInfoForAiHighlighter = {
      id: streamInfo.id,
      title: streamInfo.title,
      game: streamInfo.game,
    };

    this.flow(filePath, streamInfoForHighlighter);
  }

  async flow(filePath: string, streamInfo: StreamInfoForAiHighlighter): Promise<void> {
    if (this.aiHighlighterEnabled === false) {
      console.log('HighlighterService: Not enabled');
      return;
    }

    // if update is already in progress, need to wait until it's done
    if (this.aiHighlighterUpdater.updateInProgress) {
      await this.aiHighlighterUpdater.currentUpdate;
    } else if (await this.aiHighlighterUpdater.isNewVersionAvailable()) {
      await this.startUpdater();
    }

    const fallbackTitle = 'awesome-stream';
    const sanitizedTitle = streamInfo.title
      ? streamInfo.title.replace(/[\\/:"*?<>|]+/g, ' ')
      : this.extractDateTimeFromPath(filePath) || fallbackTitle;

    const setStreamInfo: IHighlightedStream = {
      state: {
        type: 'detection-in-progress',
        progress: 0,
      },
      date: moment().toISOString(),
      id: streamInfo.id || 'noId',
      title: sanitizedTitle,
      game: streamInfo.game || 'no title',
      abortController: new AbortController(),
      path: filePath,
    };

    await this.addStream(setStreamInfo);

    const progressTracker = new ProgressTracker(progress => {
      setStreamInfo.state.progress = progress;
      this.updateStream(setStreamInfo);
    });

    const renderHighlights = async (partialHighlights: IHighlight[]) => {
      console.log('🔄 cutHighlightClips');
      this.updateStream({ state: 'Generating clips', ...setStreamInfo });
      const clipData = await this.cutHighlightClips(filePath, partialHighlights, setStreamInfo);
      console.log('✅ cutHighlightClips');
      // 6. add highlight clips
      progressTracker.destroy();
      setStreamInfo.state.type = 'detection-finished';
      this.updateStream(setStreamInfo);

      console.log('🔄 addClips', clipData);
      this.addAiClips(clipData, streamInfo);
      console.log('✅ addClips');
    };

    console.log('🔄 HighlighterData');
    try {
      const highlighterResponse = await getHighlightClips(
        filePath,
        renderHighlights,
        setStreamInfo.abortController.signal,
        (progress: number) => {
          progressTracker.updateProgressFromHighlighter(progress);
        },
      );

      this.usageStatisticsService.recordAnalyticsEvent('AIHighlighter', {
        type: 'Detection',
        clips: highlighterResponse.length,
        game: 'Fortnite', // hardcode for now
      });
      console.log('✅ Final HighlighterData', highlighterResponse);
    } catch (error: unknown) {
      if (error instanceof Error && error.message === 'Highlight generation canceled') {
        setStreamInfo.state.type = 'detection-canceled-by-user';
      } else {
        console.error('Error in highlight generation:', error);
        setStreamInfo.state.type = 'error';
      }
    } finally {
      setStreamInfo.abortController = undefined;
      this.updateStream(setStreamInfo);
      // stopProgressUpdates();
    }

    return;
  }

  cancelHighlightGeneration(streamId: string): void {
    const stream = this.views.highlightedStreams.find(s => s.id === streamId);
    if (stream && stream.abortController) {
      console.log('cancelHighlightGeneration', streamId);
      stream.abortController.abort();
    }
  }

  async getHighlightClipsRest(
    type: string,
    video_uri: string,
    trim: { start_time: number; start_end: number } | undefined,
  ) {
    // Call highlighter code - replace with function
    try {
      const body = {
        video_uri,
        url,
        trim,
      };

      const controller = new AbortController();
      const signal = controller.signal;
      const timeout = 1000 * 60 * 30; // 30 minutes
      console.time('requestDuration');
      const fetchTimeout = setTimeout(() => {
        controller.abort();
      }, timeout);

      const response = await fetch(`http://127.0.0.1:8000${type}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify(body),
        signal,
      });

      clearTimeout(fetchTimeout);
      console.timeEnd('requestDuration');

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error: unknown) {
      console.timeEnd('requestDuration');

      if ((error as any).name === 'AbortError') {
        console.error('Fetch request timed out');
      } else {
        console.error('Fetch error:', error);
      }

      throw new Error('Error while fetching');
    }
  }

  async cutHighlightClips(
    videoUri: string,
    highlighterData: IHighlight[],
    streamInfo: IHighlightedStream,
  ): Promise<INewClipData[]> {
    const id = streamInfo.id;
    const fallbackTitle = 'awesome-stream';
    const videoDir = path.dirname(videoUri);
    const filename = path.basename(videoUri);
    const sanitizedTitle = streamInfo.title
      ? streamInfo.title.replace(/[\\/:"*?<>|]+/g, ' ')
      : fallbackTitle;
    const folderName = `${filename}-Clips-${sanitizedTitle}-${id.slice(id.length - 4, id.length)}`;
    const outputDir = path.join(videoDir, folderName);

    // Check if directory for clips exists, if not create it
    try {
      try {
        await fs.readdir(outputDir);
      } catch (error: unknown) {
        await fs.mkdir(outputDir);
      }
    } catch (error: unknown) {
      console.error('Error creating file directory');
      return null;
    }

    const sortedHighlights = highlighterData.sort((a, b) => a.start_time - b.start_time);
    const results: INewClipData[] = [];
    const processedFiles = new Set<string>();

    const duration = await this.getVideoDuration(videoUri);

    // First check the codec
    const probeArgs = [
      '-v',
      'error',
      '-select_streams',
      'v:0',
      '-show_entries',
      'stream=codec_name,format=duration',
      '-of',
      'default=nokey=1:noprint_wrappers=1',
      videoUri,
    ];
    let codec = '';
    try {
      const codecResult = await execa(FFPROBE_EXE, probeArgs);
      codec = codecResult.stdout.trim();
      console.log(`Codec for ${videoUri}: ${codec}`);
    } catch (error: unknown) {
      console.error(`Error checking codec for ${videoUri}:`, error);
    }
    console.time('export');
    const BATCH_SIZE = 1;
    const DEFAULT_START_TRIM = 10;
    const DEFAULT_END_TRIM = 10;

    for (let i = 0; i < sortedHighlights.length; i += BATCH_SIZE) {
      const highlightBatch = sortedHighlights.slice(i, i + BATCH_SIZE);
      const batchTasks = highlightBatch.map((highlight: IHighlight) => {
        return async () => {
          const formattedStart = highlight.start_time.toString().padStart(6, '0');
          const formattedEnd = highlight.end_time.toString().padStart(6, '0');
          const outputFilename = `${folderName}-${formattedStart}-${formattedEnd}.mp4`;
          const outputUri = path.join(outputDir, outputFilename);

          if (processedFiles.has(outputUri)) {
            console.log('File already exists');
            return null;
          }
          processedFiles.add(outputUri);

          // Check if the file with that name already exists and delete it if it does
          try {
            await fs.access(outputUri);
            await fs.unlink(outputUri);
          } catch (err: unknown) {
            if ((err as any).code !== 'ENOENT') {
              console.error(`Error checking existence of ${outputUri}:`, err);
            }
          }

          // Calculate new start and end times + new clip duration
          const newClipStartTime = Math.max(0, highlight.start_time - DEFAULT_START_TRIM);
          const actualStartTrim = highlight.start_time - newClipStartTime;
          const newClipEndTime = Math.min(duration, highlight.end_time + DEFAULT_END_TRIM);
          const actualEndTrim = newClipEndTime - highlight.end_time;

          const args = [
            '-ss',
            newClipStartTime.toString(),
            '-to',
            newClipEndTime.toString(),
            '-i',
            videoUri,
            '-c:v',
            codec === 'h264' ? 'copy' : 'libx264',
            '-c:a',
            'aac',
            '-strict',
            'experimental',
            '-b:a',
            '192k',
            '-movflags',
            'faststart',
            outputUri,
          ];

          try {
            const subprocess = execa(FFMPEG_EXE, args);
            const timeoutDuration = 1000 * 60 * 5;
            const timeoutId = setTimeout(() => {
              console.warn(`FFMPEG process timed out for ${outputUri}`);
              subprocess.kill('SIGTERM', { forceKillAfterTimeout: 2000 });
            }, timeoutDuration);

            try {
              await subprocess;
              console.log(`Created segment: ${outputUri}`);
              const newClipData: INewClipData = {
                path: outputUri,
                aiClipInfo: {
                  inputs: highlight.inputs,
                  score: highlight.score,
                  metadata: highlight.metadata,
                },
                startTime: highlight.start_time,
                endTime: highlight.end_time,
                startTrim: actualStartTrim,
                endTrim: actualEndTrim,
              };
              return newClipData;
            } catch (error: unknown) {
              console.warn(`Error during FFMPEG execution for ${outputUri}:`, error);
              return null;
            } finally {
              clearTimeout(timeoutId);
            }
          } catch (error: unknown) {
            console.error(`Error creating segment: ${outputUri}`, error);
            return null;
          }
        };
      });

      const batchResults = await Promise.allSettled(batchTasks.map(task => task()));
      results.push(
        ...batchResults
          .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
          .map(result => result.value)
          .filter(value => value !== null),
      );

      const failedResults = batchResults.filter(result => result.status === 'rejected');

      if (failedResults.length > 0) {
        console.error('Failed exports:', failedResults);
      }
    }

    console.timeEnd('export');
    return results;
  }
  getClips(clips: TClip[], streamId?: string): TClip[] {
    return clips.filter(clip => {
      if (clip.path === 'add') {
        return false;
      }
      const exists = this.fileExists(clip.path);
      if (!exists) {
        this.removeClip(clip.path, streamId);
        return false;
      }
      if (streamId) {
        return clip.streamInfo?.[streamId];
      }
      return true;
    });
  }

  getClipsLoaded(clips: TClip[], streamId?: string): boolean {
    return this.getClips(clips, streamId).every(clip => clip.loaded);
  }

  getRoundDetails(
    clips: TClip[],
  ): { round: number; inputs: IInput[]; duration: number; hypeScore: number }[] {
    const roundsMap: {
      [key: number]: { inputs: IInput[]; duration: number; hypeScore: number; count: number };
    } = {};
    clips.forEach(clip => {
      const aiClip = isAiClip(clip) ? clip : undefined;
      const round = aiClip?.aiInfo?.metadata?.round ?? undefined;
      if (aiClip?.aiInfo?.inputs && round) {
        if (!roundsMap[round]) {
          roundsMap[round] = { inputs: [], duration: 0, hypeScore: 0, count: 0 };
        }
        roundsMap[round].inputs.push(...aiClip.aiInfo.inputs);
        roundsMap[round].duration += aiClip.duration
          ? aiClip.duration - aiClip.startTrim - aiClip.endTrim
          : 0;
        roundsMap[round].hypeScore += aiClip.aiInfo.score;
        roundsMap[round].count += 1;
      }
    });

    return Object.keys(roundsMap).map(round => {
      const averageScore =
        roundsMap[parseInt(round, 10)].hypeScore / roundsMap[parseInt(round, 10)].count;
      const hypeScore = Math.ceil(Math.min(1, Math.max(0, averageScore)) * 5);

      return {
        round: parseInt(round, 10),
        inputs: roundsMap[parseInt(round, 10)].inputs,
        duration: roundsMap[parseInt(round, 10)].duration,
        hypeScore,
      };
    });
  }

  async getVideoDuration(filePath: string): Promise<number> {
    const { stdout } = await execa(FFPROBE_EXE, [
      '-v',
      'error',
      '-show_entries',
      'format=duration',
      '-of',
      'default=noprint_wrappers=1:nokey=1',
      filePath,
    ]);
    const duration = parseFloat(stdout);
    return duration;
  }

  enableOnlySpecificClips(clips: TClip[], streamId?: string) {
    clips.forEach(clip => {
      this.UPDATE_CLIP({
        path: clip.path,
        enabled: false,
      });
    });

    // Enable specific clips
    const clipsToEnable = this.getClips(clips, streamId);
    clipsToEnable.forEach(clip => {
      this.UPDATE_CLIP({
        path: clip.path,
        enabled: true,
      });
    });
  }

  private updateProgress(progress: IDownloadProgress) {
    // this is a lie and its not a percent, its float from 0 and 1
    this.SET_UPDATER_PROGRESS(progress.percent * 100);
  }

  /**
   * Start updater process
   */
  private async startUpdater() {
    try {
      this.SET_UPDATER_STATE(true);
      this.SET_HIGHLIGHTER_VERSION(this.aiHighlighterUpdater.version || '');
      await this.aiHighlighterUpdater.update(progress => this.updateProgress(progress));
    } finally {
      this.SET_UPDATER_STATE(false);
    }
  }
}
