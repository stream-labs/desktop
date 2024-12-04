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
import { CLIP_DIR, SCRUB_SPRITE_DIRECTORY, SUPPORTED_FILE_TYPES, TEST_MODE } from './constants';
import { pmap } from 'util/pmap';
import { Clip } from './clip';
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
import { EHighlighterInputTypes } from './ai-highlighter/ai-highlighter';
export type TStreamInfo =
  | {
      orderPosition: number;
      initialStartTime?: number;
      initialEndTime?: number;
    }
  | undefined; // initialTimesInStream

const isAiClip = (clip: TClip): clip is IAiClip => clip.source === 'AiClip';

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
  metadata: { round: number };
}

export type TClip = IAiClip | IReplayBufferClip | IManualClip;

export enum EHighlighterView {
  CLIPS = 'clips',
  SETTINGS = 'settings',
}

interface TClipsViewState {
  view: EHighlighterView.CLIPS;
  id: string | undefined;
}

interface ISettingsViewState {
  view: EHighlighterView.SETTINGS;
}

export type IViewState = TClipsViewState | ISettingsViewState;

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

interface IHighligherState {
  clips: Dictionary<TClip>;
  transition: ITransitionInfo;
  video: IVideoInfo;
  audio: IAudioInfo;
  export: IExportInfo;
  upload: IUploadInfo;
  dismissedTutorial: boolean;
  error: string;
  highlightedStreams: IHighlightedStream[];
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
}

class HighligherViews extends ViewHandler<IHighligherState> {
  /**
   * Returns an array of clips
   */
  get clips() {
    return Object.values(this.state.clips);
  }
  get clipsDictionary() {
    return this.state.clips;
  }

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
export class HighlighterService extends PersistentStatefulService<IHighligherState> {
  static defaultState: IHighligherState = {
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
    highlightedStreams: [],
  };

  static filter(state: IHighligherState) {
    return {
      ...this.defaultState,
      clips: state.clips,
      highlightedStreams: state.highlightedStreams,
      video: state.video,
      audio: state.audio,
      transition: state.transition,
    };
  }
  @Inject() streamingService: StreamingService;
  @Inject() userService: UserService;
  @Inject() usageStatisticsService: UsageStatisticsService;
  @Inject() dismissablesService: DismissablesService;
  @Inject() notificationsService: NotificationsService;
  @Inject() jsonrpcService: JsonrpcService;
  @Inject() navigationService: NavigationService;
  @Inject() sharedStorageService: SharedStorageService;

  /**
   * A dictionary of actual clip classes.
   * These are not serializable so kept out of state.
   */
  clips: Dictionary<Clip> = {};

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

  get views() {
    return new HighligherViews(this.state);
  }

  async init() {
    super.init();

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
    } else {
      let streamStarted = false;

      this.streamingService.replayBufferFileWrite.subscribe(async clipPath => {
        this.addClips([{ path: clipPath }], undefined, 'ReplayBuffer');
      });

      this.streamingService.streamingStatusChange.subscribe(async status => {
        if (status === EStreamingState.Live) {
          streamStarted = true;
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

            this.usageStatisticsService.recordAnalyticsEvent('Highlighter', {
              type: 'NotificationShow',
            });
          }

          streamStarted = false;
        }
      });
    }
  }

  notificationAction() {
    this.navigationService.navigate('Highlighter');
    this.dismissablesService.dismiss(EDismissable.HighlighterNotification);
    this.usageStatisticsService.recordAnalyticsEvent('Highlighter', {
      type: 'NotificationClick',
    });
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
    this.REMOVE_CLIP(path);
    this.removeScrubFile(clip.scrubSprite);
    delete this.clips[path];
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

  async removeScrubFile(clipPath: string) {
    try {
      await fs.remove(clipPath);
    } catch (error: unknown) {
      console.error('Error removing scrub file', error);
    }
  }

  async loadClips(streamInfoId?: string | undefined) {
    const clipsToLoad: TClip[] = this.getClips(this.views.clips, streamInfoId);

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

      this.clips[clip.path] = this.clips[clip.path] ?? new Clip(clip.path);
    }

    //TODO M: tracking type not correct
    await pmap(
      clipsToLoad.filter(c => !c.loaded),
      c => this.clips[c.path].init(),
      {
        concurrency: os.cpus().length,
        onProgress: completed => {
          this.usageStatisticsService.recordAnalyticsEvent('Highlighter', {
            type: 'ClipImport',
            source: completed.source,
          });
          this.UPDATE_CLIP({
            path: completed.path,
            loaded: true,
            scrubSprite: this.clips[completed.path].frameSource?.scrubJpg,
            duration: this.clips[completed.path].duration,
            deleted: this.clips[completed.path].deleted,
          });
        },
      },
    );
    return;
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
  async export(preview = false, streamId: string | undefined = undefined) {
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

    let clips: Clip[] = [];
    if (streamId) {
      clips = this.getClips(this.views.clips, streamId)
        .filter(clip => clip.enabled && clip.streamInfo && clip.streamInfo[streamId] !== undefined)
        .sort(
          (a: TClip, b: TClip) =>
            a.streamInfo[streamId].orderPosition - b.streamInfo[streamId].orderPosition,
        )
        .map(c => {
          const clip = this.clips[c.path];

          clip.startTrim = c.startTrim;
          clip.endTrim = c.endTrim;

          return clip;
        });
    } else {
      clips = this.views.clips
        .filter(c => c.enabled)
        .sort((a: TClip, b: TClip) => a.globalOrderPosition - b.globalOrderPosition)
        .map(c => {
          const clip = this.clips[c.path];

          clip.startTrim = c.startTrim;
          clip.endTrim = c.endTrim;

          return clip;
        });
    }

    if (this.views.video.intro.path) {
      const intro: Clip = new Clip(this.views.video.intro.path);
      await intro.init();
      intro.startTrim = 0;
      intro.endTrim = 0;
      clips.unshift(intro);
    }
    if (this.views.video.outro.path) {
      const outro = new Clip(this.views.video.outro.path);
      await outro.init();
      outro.startTrim = 0;
      outro.endTrim = 0;
      clips.push(outro);
    }

    const exportOptions: IExportOptions = preview
      ? { width: 1280 / 4, height: 720 / 4, fps: 30, preset: 'ultrafast' }
      : {
          width: this.views.exportInfo.resolution === 720 ? 1280 : 1920,
          height: this.views.exportInfo.resolution === 720 ? 720 : 1080,
          fps: this.views.exportInfo.fps,
          preset: this.views.exportInfo.preset,
        };

    // Reset all clips
    await pmap(clips, c => c.reset(exportOptions), {
      onProgress: c => {
        if (c.deleted) {
          this.UPDATE_CLIP({ path: c.sourcePath, deleted: true });
        }
      },
    });

    // TODO: For now, just remove deleted clips from the video
    // In the future, abort export and surface error to the user.
    clips = clips.filter(c => !c.deleted);

    if (!clips.length) {
      console.error('Highlighter: Export called without any clips!');
      return;
    }

    // Estimate the total number of frames to set up export info
    const totalFrames = clips.reduce((count: number, clip) => {
      return count + clip.frameSource.nFrames;
    }, 0);
    const numTransitions = clips.length - 1;
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
      await Promise.all(clips.filter(c => c.hasAudio).map(clip => clip.audioSource.extract()));
      const parsed = path.parse(this.views.exportInfo.file);
      const audioConcat = path.join(parsed.dir, `${parsed.name}-concat.flac`);
      let audioMix = path.join(parsed.dir, `${parsed.name}-mix.flac`);
      fader = new AudioCrossfader(audioConcat, clips, this.views.transitionDuration);
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

      await Promise.all(clips.map(clip => clip.audioSource.cleanup()));
      const nClips = clips.length;

      this.SET_EXPORT_INFO({ step: EExportStep.FrameRender });

      // Cannot be null because we already checked there is at least 1 element in the array
      let fromClip = clips.shift()!;
      let toClip = clips.shift();

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
          toClip = clips.shift();
        }

        if (!fromClip) {
          console.log('Out of sources, closing file');
          await writer.end();
          console.debug(
            `Export complete - Expected Frames: ${this.views.exportInfo.totalFrames} Actual Frames: ${currentFrame}`,
          );

          this.usageStatisticsService.recordAnalyticsEvent('Highlighter', {
            type: 'ExportComplete',
            numClips: nClips,
            transition: this.views.transition.type,
            transitionDuration: this.views.transition.duration,
            resolution: this.views.exportInfo.resolution,
            fps: this.views.exportInfo.fps,
            preset: this.views.exportInfo.preset,
            duration: totalFramesAfterTransitions / exportOptions.fps,
            isPreview: preview,
          });
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
        this.usageStatisticsService.recordAnalyticsEvent('Highlighter', {
          type: 'ExportError',
          error: e.constructor.name,
        });
      } else {
        this.SET_EXPORT_INFO({ error: $t('An error occurred while exporting the video') });
        this.usageStatisticsService.recordAnalyticsEvent('Highlighter', {
          type: 'ExportError',
          error: 'Unknown',
        });
      }
    }

    if (fader) await fader.cleanup();
    if (mixer) await mixer.cleanup();
    this.SET_EXPORT_INFO({
      exporting: false,
      exported: !this.views.exportInfo.cancelRequested && !preview && !this.views.exportInfo.error,
    });
    this.SET_UPLOAD_INFO({ videoId: null });
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
        this.usageStatisticsService.recordAnalyticsEvent('Highlighter', {
          type: 'UploadYouTubeError',
        });
      }
    }

    this.cancelFunction = null;
    this.SET_UPLOAD_INFO({
      uploading: false,
      cancelRequested: false,
      videoId: result ? result.id : null,
    });

    if (result) {
      this.usageStatisticsService.recordAnalyticsEvent('Highlighter', {
        type: 'UploadYouTubeSuccess',
        privacy: options.privacyStatus,
        videoLink:
          options.privacyStatus === 'public'
            ? `https://youtube.com/watch?v=${result.id}`
            : undefined,
      });
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

  getClips(clips: TClip[], streamId?: string): TClip[] {
    const inputClips = clips.filter(clip => clip.path !== 'add');
    let wantedClips;

    if (streamId) {
      wantedClips = inputClips.filter(clip => clip.streamInfo?.[streamId]);
    } else {
      wantedClips = inputClips;
    }

    const outputClips = wantedClips.filter(c => this.fileExists(c.path));
    if (outputClips.length !== wantedClips.length) {
      wantedClips
        .filter(c => !this.fileExists(c.path))
        .forEach(clip => {
          this.removeClip(clip.path, streamId);
        });
    }
    return outputClips;
  }
}
