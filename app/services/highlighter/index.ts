import { mutation, StatefulService, ViewHandler, Inject } from 'services/core';
import path from 'path';
import transitions from 'gl-transitions';
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
import { CLIP_DIR, FPS, SCRUB_SPRITE_DIRECTORY, TEST_MODE } from './constants';
import { pmap } from 'util/pmap';
import { Clip } from './clip';
import { AudioCrossfader } from './audio-crossfader';
import { FrameWriter } from './frame-writer';
import { Transitioner } from './transitioner';
import { throttle } from 'lodash-decorators';

export interface IClip {
  path: string;
  loaded: boolean;
  enabled: boolean;
  scrubSprite?: string;
  startTrim: number;
  endTrim: number;
  duration?: number;
  deleted: boolean;
}

export enum EExportStep {
  AudioMix = 'audio',
  FrameRender = 'frames',
}

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
}

export interface IUploadInfo {
  uploading: boolean;
  uploadedBytes: number;
  totalBytes: number;
  cancelRequested: boolean;
  videoId: string | null;
}

export interface ITransitionInfo {
  type: string;
  duration: number;
}

interface IHighligherState {
  clips: Dictionary<IClip>;
  clipOrder: string[];
  transition: ITransitionInfo;
  export: IExportInfo;
  upload: IUploadInfo;
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

  get transitionDuration() {
    return this.state.transition.duration;
  }

  get transitionFrames() {
    return this.transitionDuration * FPS;
  }

  get transitions() {
    return transitions;
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

export class HighlighterService extends StatefulService<IHighligherState> {
  static initialState = {
    clips: {},
    clipOrder: [],
    transition: {
      type: 'fade',
      duration: 1,
    },
    export: {
      exporting: false,
      currentFrame: 0,
      totalFrames: 0,
      step: EExportStep.AudioMix,
      cancelRequested: false,
      file: path.join(electron.remote.app.getPath('videos'), 'Output.mp4'),
      previewFile: path.join(os.tmpdir(), 'highlighter-preview.mp4'),
      exported: false,
    },
    upload: {
      uploading: false,
      uploadedBytes: 0,
      totalBytes: 0,
      cancelRequested: false,
      videoId: null,
    },
  } as IHighligherState;

  @Inject() streamingService: StreamingService;
  @Inject() userService: UserService;

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

  get views() {
    return new HighligherViews(this.state);
  }

  init() {
    if (TEST_MODE) {
      const clipsToLoad = [
        // Aero 15 test clips
        // path.join(CLIP_DIR, '2021-05-12 12-59-28.mp4'),
        // path.join(CLIP_DIR, 'Replay 2021-03-30 14-13-20.mp4'),
        path.join(CLIP_DIR, 'Replay 2021-03-30 14-13-29.mp4'),
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
        path.join(CLIP_DIR, 'Replay 2021-03-30 14-36-44.mp4'),
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
        });
      });
    }
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

  setOrder(order: string[]) {
    this.SET_ORDER(order);
  }

  setTransition(transition: Partial<ITransitionInfo>) {
    this.SET_TRANSITION_INFO(transition);
  }

  setExportFile(file: string) {
    this.SET_EXPORT_INFO({ file });
  }

  async loadClips() {
    await this.ensureScrubDirectory();

    // Ensure we have a Clip class for every clip in the store
    this.views.clips.forEach(c => {
      this.clips[c.path] = this.clips[c.path] ?? new Clip(c.path);
    });

    await pmap(this.views.clips, c => this.clips[c.path].init(), {
      concurrency: 5, // TODO
      onProgress: completed => {
        this.UPDATE_CLIP({
          path: completed.path,
          loaded: true,
          scrubSprite: this.clips[completed.path].frameSource?.scrubJpg,
          duration: this.clips[completed.path].duration,
          deleted: this.clips[completed.path].deleted,
        });
      },
    });
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

    // Reset all clips
    await pmap(clips, c => c.reset(preview), {
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
    const totalFramesAfterTransitions = totalFrames - numTransitions * this.views.transitionFrames;

    this.SET_EXPORT_INFO({
      exporting: true,
      currentFrame: 0,
      totalFrames: totalFramesAfterTransitions,
      step: EExportStep.AudioMix,
      cancelRequested: false,
    });

    let currentFrame = 0;

    // Mix audio first
    await Promise.all(clips.map(clip => clip.audioSource.extract()));
    const parsed = path.parse(this.views.exportInfo.file);
    const audioMix = path.join(parsed.dir, `${parsed.name}-audio.flac`);
    const fader = new AudioCrossfader(audioMix, clips, this.views.transitionDuration);
    await fader.export();
    await Promise.all(clips.map(clip => clip.audioSource.cleanup()));

    this.SET_EXPORT_INFO({ step: EExportStep.FrameRender });

    // Cannot be null because we already checked there is at least 1 element in the array
    let fromClip = clips.shift()!;
    let toClip = clips.shift();

    const transitioner = new Transitioner(this.state.transition.type, preview);
    const exportPath = preview ? this.views.exportInfo.previewFile : this.views.exportInfo.file;
    const writer = new FrameWriter(exportPath, audioMix, preview);

    while (true) {
      if (this.views.exportInfo.cancelRequested) {
        if (fromClip) fromClip.frameSource.end();
        if (toClip) toClip.frameSource.end();
        await writer.end();
        break;
      }

      const fromFrameRead = await fromClip.frameSource.readNextFrame();

      const transitionFrames = Math.min(
        this.views.transitionFrames,
        (fromClip.frameSource.trimmedDuration / 2) * FPS,
        toClip ? (toClip.frameSource.trimmedDuration / 2) * FPS : Infinity,
      );

      const inTransition =
        fromClip.frameSource.currentFrame >= fromClip.frameSource.nFrames - transitionFrames;
      let frameToRender = fromClip.frameSource.readBuffer;

      if (inTransition && toClip) {
        await toClip.frameSource.readNextFrame();

        transitioner.renderTransition(
          fromClip.frameSource.readBuffer,
          toClip.frameSource.readBuffer,

          // Frame counter refers to next frame we will read
          // Subtract 1 to get the frame we just read
          (toClip.frameSource.currentFrame - 1) / this.views.transitionFrames,
        );
        frameToRender = transitioner.getFrame();

        const transitionEnded = fromClip.frameSource.currentFrame === fromClip.frameSource.nFrames;

        if (transitionEnded) {
          fromClip.frameSource.end();
          fromClip = toClip;
          toClip = clips.shift();
        }
      }

      if (fromFrameRead) {
        await writer.writeNextFrame(frameToRender);
        // this.SET_EXPORT_INFO({ currentFrame: this.state.export.currentFrame + 1 });
        currentFrame++;
        this.setCurrentFrame(currentFrame);
      } else {
        console.log('Out of sources, closing file');
        await writer.end();
        break;
      }
    }

    await fader.cleanup();
    this.SET_EXPORT_INFO({
      exporting: false,
      exported: !this.views.exportInfo.cancelRequested && !preview,
    });
    this.SET_UPLOAD_INFO({ videoId: null });
  }

  // We throttle because this can go extremely fast, especially on previews
  @throttle(100)
  private setCurrentFrame(frame: number) {
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

    this.SET_UPLOAD_INFO({ uploading: true, cancelRequested: false });

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
        console.error('Got error uploading YT video', e);
      }
    }

    this.cancelFunction = null;
    this.SET_UPLOAD_INFO({
      uploading: false,
      cancelRequested: false,
      videoId: result ? result.id : null,
    });
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
