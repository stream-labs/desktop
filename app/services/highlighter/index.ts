import { mutation, StatefulService, ViewHandler, Inject, InitAfter } from 'services/core';
import path from 'path';
import Vue from 'vue';
import fs from 'fs-extra';
import url from 'url';
import { StreamingService } from 'services/streaming';
import electron from 'electron';
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

export interface IClip {
  path: string;
  loaded: boolean;
  enabled: boolean;
  scrubSprite?: string;
  startTrim: number;
  endTrim: number;
  duration?: number;
  deleted: boolean;
  source: 'ReplayBuffer' | 'Manual';
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

interface IHighligherState {
  clips: Dictionary<IClip>;
  clipOrder: string[];
  transition: ITransitionInfo;
  audio: IAudioInfo;
  export: IExportInfo;
  upload: IUploadInfo;
  dismissedTutorial: boolean;
  error: string;
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
   * Returns an array of clips in their display order
   */
  get clips() {
    return this.state.clipOrder.map(p => this.state.clips[p]);
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
export class HighlighterService extends StatefulService<IHighligherState> {
  static initialState: IHighligherState = {
    clips: {},
    clipOrder: [],
    transition: {
      type: 'fade',
      duration: 1,
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
  };

  @Inject() streamingService: StreamingService;
  @Inject() userService: UserService;
  @Inject() usageStatisticsService: UsageStatisticsService;

  /**
   * A dictionary of actual clip classes.
   * These are not serializable so kept out of state.
   */
  clips: Dictionary<Clip> = {};

  directoryCleared = false;

  @mutation()
  ADD_CLIP(clip: IClip) {
    Vue.set(this.state.clips, clip.path, clip);
    this.state.clipOrder.push(clip.path);
    this.state.export.exported = false;
  }

  @mutation()
  UPDATE_CLIP(clip: Partial<IClip> & { path: string }) {
    Vue.set(this.state.clips, clip.path, {
      ...this.state.clips[clip.path],
      ...clip,
    });
    this.state.export.exported = false;
  }

  @mutation()
  REMOVE_CLIP(clipPath: string) {
    Vue.delete(this.state.clips, clipPath);
    this.state.clipOrder = this.state.clipOrder.filter(c => c !== clipPath);
    this.state.export.exported = false;
  }

  @mutation()
  SET_ORDER(order: string[]) {
    this.state.clipOrder = order;
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

  init() {
    try {
      // On some very very small number of systems, we won't be able to fetch
      // the videos path from the system.
      // TODO: Add a fallback directory?
      this.SET_EXPORT_INFO({
        file: path.join(electron.remote.app.getPath('videos'), 'Output.mp4'),
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

      clipsToLoad.forEach(c => {
        this.ADD_CLIP({
          path: c,
          loaded: false,
          enabled: true,
          startTrim: 0,
          endTrim: 0,
          deleted: false,
          source: 'Manual',
        });
      });
    } else {
      this.streamingService.replayBufferFileWrite.subscribe(clipPath => {
        this.ADD_CLIP({
          path: clipPath,
          loaded: false,
          enabled: true,
          startTrim: 0,
          endTrim: 0,
          deleted: false,
          source: 'ReplayBuffer',
        });
      });
    }
  }

  addClips(paths: string[]) {
    paths.forEach(path => {
      // Don't allow adding the same clip twice
      if (this.state.clips[path]) return;

      this.ADD_CLIP({
        path,
        loaded: false,
        enabled: true,
        startTrim: 0,
        endTrim: 0,
        deleted: false,
        source: 'Manual',
      });
    });
  }

  enableClip(path: string, enabled: boolean) {
    this.UPDATE_CLIP({
      path,
      enabled,
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

  removeClip(path: string) {
    this.REMOVE_CLIP(path);
  }

  setOrder(order: string[]) {
    this.SET_ORDER(order);
  }

  setTransition(transition: Partial<ITransitionInfo>) {
    this.SET_TRANSITION_INFO(transition);
  }

  setAudio(audio: Partial<IAudioInfo>) {
    this.SET_AUDIO_INFO(audio);
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

  fileExists(file: string) {
    return fs.existsSync(file);
  }

  async loadClips() {
    await this.ensureScrubDirectory();

    // Ensure we have a Clip class for every clip in the store
    // Also make sure they are the correct format
    this.views.clips.forEach(c => {
      if (!SUPPORTED_FILE_TYPES.map(e => `.${e}`).includes(path.parse(c.path).ext)) {
        this.REMOVE_CLIP(c.path);
        this.SET_ERROR(
          $t(
            'One or more clips could not be imported because they were not recorded in a supported file format.',
          ),
        );
      }

      this.clips[c.path] = this.clips[c.path] ?? new Clip(c.path);
    });

    await pmap(
      this.views.clips.filter(c => !c.loaded),
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
  }

  private async ensureScrubDirectory() {
    // We clear this out once per application run
    if (this.directoryCleared) return;
    this.directoryCleared = true;

    await fs.remove(SCRUB_SPRITE_DIRECTORY);
    await fs.mkdir(SCRUB_SPRITE_DIRECTORY);
  }

  cancelExport() {
    this.SET_EXPORT_INFO({ cancelRequested: true });
  }

  /**
   * Exports the video using the currently configured settings
   * Return true if the video was exported, or false if not.
   */
  async export(preview = false) {
    if (!this.views.loaded) {
      console.error('Highlighter: Export called while clips are not fully loaded!');
      return;
    }

    if (this.views.exportInfo.exporting) {
      console.error('Highlighter: Cannot export until current export operation is finished');
      return;
    }

    let clips = this.views.clips
      .filter(c => c.enabled)
      .map(c => {
        const clip = this.clips[c.path];

        // Set trims on the frame source
        clip.startTrim = c.startTrim;
        clip.endTrim = c.endTrim;

        return clip;
      });

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

  async upload(options: IYoutubeVideoUploadOptions) {
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
          type: 'UploadError',
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
        type: 'UploadSuccess',
        privacy: options.privacyStatus,
        videoLink:
          options.privacyStatus === 'public'
            ? `https://youtube.com/watch?v=${result.id}`
            : undefined,
      });
    }
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
}
