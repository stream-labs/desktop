import { mutation, StatefulService, ViewHandler, Inject } from 'services/core';
import path from 'path';
import execa from 'execa';
import transitions from 'gl-transitions';
import createTransition from './create-transition';
import Vue from 'vue';
import fs from 'fs-extra';
import { StreamingService } from 'services/streaming';
import electron from 'electron';
import Utils from 'services/utils';
import { getPlatformService } from 'services/platforms';
import { UserService } from 'services/user';
import {
  IYoutubeVideoUploadOptions,
  IYoutubeUploadResponse,
} from 'services/platforms/youtube/uploader';
import { YoutubeService } from 'services/platforms/youtube';
import os from 'os';

const FFMPEG_DIR = Utils.isDevMode()
  ? path.resolve('node_modules', 'ffmpeg-ffprobe-static')
  : path.resolve(process.resourcesPath, 'node_modules', 'ffmpeg-ffprobe-static');

const FFMPEG_EXE = path.join(FFMPEG_DIR, 'ffmpeg.exe');
const FFPROBE_EXE = path.join(FFMPEG_DIR, 'ffprobe.exe');

const CLIP_DIR = path.resolve('C:/', 'Users', 'acree', 'Videos');
export const CLIP_1 = path.join(CLIP_DIR, '1.mp4');
export const CLIP_2 = path.join(CLIP_DIR, '2.mp4');
export const CLIP_3 = path.join(CLIP_DIR, '3.mp4');
export const CLIP_4 = path.join(CLIP_DIR, 'Facebook Refactor.mov');

const WIDTH = 1280;
const HEIGHT = 720;
const FPS = 30;

// Frames are RGBA, 4 bytes per pixel
const FRAME_BYTE_SIZE = WIDTH * HEIGHT * 4;

const PREVIEW_WIDTH = 1280 / 4;
const PREVIEW_HEIGHT = 720 / 4;
const PREVIEW_FRAME_BYTE_SIZE = PREVIEW_HEIGHT * PREVIEW_HEIGHT * 4;

export const SCRUB_WIDTH = 320;
export const SCRUB_HEIGHT = 180;
export const SCRUB_FRAMES = 20;
export const SCRUB_SPRITE_DIRECTORY = path.join(
  electron.remote.app.getPath('userData'),
  'highlighter',
);

// const TRANSITION_DURATION = 1;
// const TRANSITION_FRAMES = TRANSITION_DURATION * FPS;

interface PmapOptions<TVal, TRet> {
  concurrency?: number;
  onProgress?: (completedItem: TVal, returnVal: TRet, nComplete: number) => void;
}

/**
 * Allows waiting on a bulk set of computationally expensive async
 * bulk operations. It behaves similarly to Promise.all, but
 * allows passing a concurency number, which restricts the number
 * of inflight operations at once, and also allows processing of
 * each item as it completes.
 * @param items A set of iterms to operate on
 * @param executor Takes an item and returns a rpmoise
 * @param options The max number of operations to process at once
 * @returns An array of return values in the same order as the original items
 */
export function pmap<TVal, TRet>(
  items: TVal[],
  executor: (val: TVal) => Promise<TRet>,
  options: PmapOptions<TVal, TRet> = {},
): Promise<TRet[]> {
  const opts: PmapOptions<TVal, TRet> = {
    concurrency: Infinity,
    ...options,
  };

  return new Promise<TRet[]>((resolve, reject) => {
    // Store each item with its index for ordering of
    // return values later.
    const toExecute: [TVal, number][] = items.map((item, index) => [item, index]);
    const returns: [TRet, number][] = [];
    const totalNum = toExecute.length;
    let errored = false;

    function executeNext() {
      const item = toExecute.shift();
      if (item == null) return;

      executor(item[0])
        .then(ret => {
          // Another promise rejected, so abort
          if (errored) return;

          returns.push([ret, item[1]]);

          // Update progress callback
          if (opts.onProgress) {
            opts.onProgress(item[0], ret, returns.length);
          }

          if (toExecute.length > 0) {
            executeNext();
          } else if (returns.length === totalNum) {
            const orderedReturns: TRet[] = [];

            returns.forEach(set => {
              orderedReturns[set[1]] = set[0];
            });

            resolve(orderedReturns);
          }
        })
        .catch(e => {
          errored = true;
          reject(e);
        });
    }

    // Fire off the initial set of requests
    Array(Math.min(items.length, opts.concurrency ?? Infinity))
      .fill(0)
      .forEach(() => executeNext());
  });
}

/**
 * Extracts an audio file from a video file
 */
export class AudioSource {
  readonly outPath: string;

  constructor(
    public readonly sourcePath: string,
    public readonly duration: number,
    public readonly startTrim: number,
    public readonly endTrim: number,
  ) {
    const parsed = path.parse(this.sourcePath);
    this.outPath = path.join(parsed.dir, `${parsed.name}-audio.flac`);
  }

  async extract() {
    /* eslint-disable */
    const args = [
      '-ss', this.startTrim.toString(),
      '-i', this.sourcePath,
      '-t', (this.duration - this.startTrim - this.endTrim).toString(),
      '-sample_fmt', 's32',
      '-ar', '48000',
      '-map', 'a:0',
      '-c:a', 'flac',
      '-y',
      this.outPath,
    ];
    /* eslint-enable */

    await execa(FFMPEG_EXE, args);
  }

  async cleanup() {
    return new Promise<void>((resolve, reject) => {
      fs.unlink(this.outPath, e => {
        if (e) {
          console.log(e);
          reject();
          return;
        }

        resolve();
      });
    });
  }
}

export class FrameSource {
  writeBuffer = Buffer.allocUnsafe(this.preview ? PREVIEW_FRAME_BYTE_SIZE : FRAME_BYTE_SIZE);
  readBuffer = Buffer.allocUnsafe(this.preview ? PREVIEW_FRAME_BYTE_SIZE : FRAME_BYTE_SIZE);
  private byteIndex = 0;

  scrubJpg: string;

  readonly width = this.preview ? PREVIEW_WIDTH : WIDTH;
  readonly height = this.preview ? PREVIEW_HEIGHT : HEIGHT;

  private ffmpeg: execa.ExecaChildProcess<Buffer | string>;

  private onFrameComplete: ((frameRead: boolean) => void) | null;

  private finished = false;

  currentFrame = 0;

  get nFrames() {
    return Math.round(this.trimmedDuration * FPS);
  }

  get trimmedDuration() {
    return this.duration - this.startTrim - this.endTrim;
  }

  constructor(
    public readonly sourcePath: string,
    public readonly duration: number,
    public readonly startTrim: number,
    public readonly endTrim: number,
    public readonly preview: boolean,
  ) {}

  async exportScrubbingSprite() {
    const parsed = path.parse(this.sourcePath);
    this.scrubJpg = path.join(SCRUB_SPRITE_DIRECTORY, `${parsed.name}-scrub.jpg`);

    /* eslint-disable */
    const args = [
      '-i', this.sourcePath,
      '-vf', `scale=${SCRUB_WIDTH}:${SCRUB_HEIGHT},fps=${SCRUB_FRAMES / this.duration},tile=${SCRUB_FRAMES}x1`,
      '-frames:v', '1',
      '-y',
      this.scrubJpg,
    ];
    /* eslint-enable */

    await execa(FFMPEG_EXE, args);
  }

  private startFfmpeg() {
    /* eslint-disable */
    const args = [
      '-ss', this.startTrim.toString(),
      '-i', this.sourcePath,
      '-t', (this.duration - this.startTrim - this.endTrim).toString(),
      '-vf', `fps=${FPS},scale=${this.width}:${this.height}`,
      '-map', 'v:0',
      '-vcodec', 'rawvideo',
      '-pix_fmt', 'rgba',
      '-f', 'image2pipe',
      '-'
    ];
    /* eslint-enable */

    console.log('FRAME SOURCE ARGS', args);

    this.ffmpeg = execa(FFMPEG_EXE, args, {
      encoding: null,
      buffer: false,
      stdin: 'ignore',
      stdout: 'pipe',
      stderr: process.stderr,
    });

    this.ffmpeg.stdout?.once('end', () => {
      console.log('STREAM HAS ENDED');
      console.log(`FRAME COUNT: Expected: ${this.nFrames} Actual: ${this.currentFrame}`);
      this.finished = true;

      // If a frame request is in progress, immediately resolve it
      if (this.onFrameComplete) this.onFrameComplete(false);
    });

    this.ffmpeg.stdout?.on('data', (chunk: Buffer) => {
      // console.log('GOT CHUNK LENGTH', chunk.length);

      this.handleChunk(chunk);
    });

    this.ffmpeg.stdout?.on('error', e => {
      console.log('error', e);
    });
  }

  /**
   * Attempts to read another frame into the readBuffer
   * @returns Returns true if a frame was read, otherwise false
   */
  readNextFrame(): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      if (!this.ffmpeg) this.startFfmpeg();

      if (this.onFrameComplete) {
        console.log('Cannot read next frame while frame read is in progress');
        resolve(false);
        return;
      }

      // The stream was closed, so resolve that a frame could not be read.
      if (this.finished) {
        resolve(false);
        return;
      }

      this.onFrameComplete = resolve;

      this.ffmpeg.stdout?.resume();
    });
  }

  end() {
    if (this.ffmpeg) this.ffmpeg.kill();
  }

  private handleChunk(chunk: Buffer) {
    const frameByteSize = this.preview ? PREVIEW_FRAME_BYTE_SIZE : FRAME_BYTE_SIZE;

    // If the chunk is larger than what's needed to fill the rest of the frame buffer,
    // only copy enough to fill the buffer.
    const bytesToCopy =
      this.byteIndex + chunk.length > frameByteSize ? frameByteSize - this.byteIndex : chunk.length;

    chunk.copy(this.writeBuffer, this.byteIndex, 0, bytesToCopy);
    this.byteIndex += bytesToCopy;

    if (this.byteIndex >= frameByteSize) {
      this.ffmpeg.stdout?.pause();

      this.swapBuffers();

      this.currentFrame++;
      if (this.onFrameComplete) this.onFrameComplete(true);
      this.onFrameComplete = null;

      const remainingBytes = chunk.length - bytesToCopy;

      if (remainingBytes > 0) {
        chunk.copy(this.writeBuffer, this.byteIndex, bytesToCopy);
        this.byteIndex += remainingBytes;
      }
    }
  }

  /**
   * Swaps read and write buffers (front/back buffer)
   */
  private swapBuffers() {
    const newRead = this.writeBuffer;
    this.writeBuffer = this.readBuffer;
    this.readBuffer = newRead;
    this.byteIndex = 0;
  }
}

export class Clip {
  frameSource: FrameSource;
  audioSource: AudioSource;

  duration: number;

  // TODO: Trim validation
  startTrim: number;
  endTrim: number;

  initPromise: Promise<void>;

  constructor(public readonly sourcePath: string) {}

  /**
   * Performs all async operations needed to display
   * this clip to the user and starting working with it:
   * - Read duration
   * - Generate scrubbing sprite on disk
   */
  init() {
    if (!this.initPromise) {
      this.initPromise = new Promise<void>((resolve, reject) => {
        this.doInit().then(resolve).catch(reject);
      });
    }

    return this.initPromise;
  }

  /**
   * FrameSource and AudioSource are disposable. Call this to reset them
   * to start reading from the file again.
   */
  reset(preview: boolean) {
    this.frameSource = new FrameSource(
      this.sourcePath,
      this.duration,
      this.startTrim,
      this.endTrim,
      preview,
    );
    this.audioSource = new AudioSource(
      this.sourcePath,
      this.duration,
      this.startTrim,
      this.endTrim,
    );
  }

  private async doInit() {
    await this.readDuration();
    this.reset(false);
    await this.frameSource.exportScrubbingSprite();
  }

  private async readDuration() {
    if (this.duration) return;

    const { stdout } = await execa(FFPROBE_EXE, [
      '-v',
      'error',
      '-show_entries',
      'format=duration',
      '-of',
      'default=noprint_wrappers=1:nokey=1',
      this.sourcePath,
    ]);
    this.duration = parseFloat(stdout);
  }
}

export class AudioCrossfader {
  constructor(
    public readonly outputPath: string,
    public readonly clips: Clip[],
    public readonly transitionDuration: number,
  ) {}

  async export() {
    const inputArgs = this.clips.reduce((args: string[], clip) => {
      return [...args, '-i', clip.audioSource.outPath];
    }, []);

    const args = [...inputArgs];

    const filterGraph = this.getFilterGraph();

    if (filterGraph.length > 0) {
      args.push('-filter_complex', filterGraph);
    }

    args.push('-c:a', 'flac', '-y', this.outputPath);

    await execa(FFMPEG_EXE, args);
  }

  getFilterGraph() {
    let inStream = '[0:a]';

    const filterGraph = this.clips
      .slice(0, -1)
      .map((clip, i) => {
        const outStream = `[concat${i}]`;

        const overlap = Math.min(
          this.transitionDuration,
          clip.frameSource.trimmedDuration,
          this.clips[i + 1] ? this.clips[i + 1].frameSource.trimmedDuration : Infinity,
        );
        let ret = `${inStream}[${i + 1}:a]acrossfade=d=${overlap}:c1=tri:c2=tri`;

        inStream = outStream;

        if (i < this.clips.length - 2) ret += outStream;

        return ret;
      })
      .join(',');

    return filterGraph;
  }

  async cleanup() {
    return new Promise<void>((resolve, reject) => {
      fs.unlink(this.outputPath, e => {
        if (e) {
          console.log(e);
          reject();
          return;
        }

        resolve();
      });
    });
  }
}

export class FrameWriter {
  constructor(
    public readonly outputPath: string,
    public readonly audioInput: string,
    public readonly preview: boolean,
  ) {}

  readonly width = this.preview ? PREVIEW_WIDTH : WIDTH;
  readonly height = this.preview ? PREVIEW_HEIGHT : HEIGHT;

  private ffmpeg: execa.ExecaChildProcess<Buffer | string>;

  exitPromise: Promise<void>;

  private startFfmpeg() {
    /* eslint-disable */
    const args = [
      // Video Input
      '-f', 'rawvideo',
      '-vcodec', 'rawvideo',
      '-pix_fmt', 'rgba',
      '-s', `${this.width}x${this.height}`,
      '-r', `${FPS}`,
      '-i', '-',

      // Audio Input
      '-i', this.audioInput,

      // Input Mapping
      '-map', '0:v:0',
      '-map', '1:a:0',

      // Video Output
      '-vf', 'format=yuv420p',
      '-vcodec', 'libx264',
      '-profile:v', 'high',
      '-preset:v', 'ultrafast',
      '-crf', '18',
      '-movflags', 'faststart',

      // Audio Output
      '-acodec', 'aac',
      '-b:a', '128k',

      '-y', this.outputPath,
    ];
    /* eslint-enable */

    console.log(args);

    this.ffmpeg = execa(FFMPEG_EXE, args, {
      encoding: null,
      buffer: false,
      stdin: 'pipe',
      stdout: process.stdout,
      stderr: 'pipe',
    });

    this.exitPromise = new Promise<void>(resolve => {
      this.ffmpeg.on('exit', code => {
        console.log('ffmpeg writer exited with code', code);
        resolve();
      });
    });

    this.ffmpeg.catch(e => {
      console.log('CAUGHT ERROR', e);
    });

    this.ffmpeg.stderr?.on('data', (data: Buffer) => {
      console.log('ffmpeg:', data.toString());
    });
  }

  async writeNextFrame(frameBuffer: Buffer) {
    if (!this.ffmpeg) this.startFfmpeg();

    await new Promise<void>((resolve, reject) => {
      this.ffmpeg.stdin?.write(frameBuffer, e => {
        if (e) {
          console.log(e);
          reject();
          return;
        }
        resolve();
      });
    });
  }

  end() {
    this.ffmpeg.stdin?.end();
    return this.exitPromise;
  }
}

export class Compositor2D {
  private canvas = document.createElement('canvas');
  private ctx = this.canvas.getContext('2d')!;

  readonly width = WIDTH;
  readonly height = HEIGHT;

  constructor() {
    this.canvas.width = this.width;
    this.canvas.height = this.height;
  }

  drawFrame(frame: Buffer) {
    const data = new ImageData(Uint8ClampedArray.from(frame), this.width, this.height);
    this.ctx.putImageData(data, 0, 0);
  }

  drawText() {
    this.ctx.font = '48px sans-serif';
    this.ctx.fillText('Hello World', 50, 50);
  }

  getFrame(): Buffer {
    return Buffer.from(this.ctx.getImageData(0, 0, this.width, this.height).data);
  }
}

/**
 * Meant to look like a subset of https://github.com/stackgl/gl-texture2d
 * but doesn't require ndarray library that requires unsafe-eval to run.
 */
class Texture2D {
  private texture: WebGLTexture;

  constructor(
    private gl: WebGLRenderingContext,
    private width: number,
    private height: number,
    data: Buffer,
  ) {
    this.texture = this.gl.createTexture();
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
    this.gl.texImage2D(
      this.gl.TEXTURE_2D,
      0,
      this.gl.RGBA,
      this.width,
      this.height,
      0,
      this.gl.RGBA,
      this.gl.UNSIGNED_BYTE,
      data,
    );
  }

  get shape(): [number, number] {
    return [this.width, this.height];
  }

  bind(texUnit: number) {
    this.gl.activeTexture(this.gl.TEXTURE0 + texUnit);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
    return this.gl.getParameter(this.gl.ACTIVE_TEXTURE) - this.gl.TEXTURE0;
  }

  dispose() {
    this.gl.deleteTexture(this.texture);
  }
}

export class Transitioner {
  private canvas = document.createElement('canvas');
  private gl = this.canvas.getContext('webgl')!;

  readonly width = this.preview ? PREVIEW_WIDTH : WIDTH;
  readonly height = this.preview ? PREVIEW_HEIGHT : HEIGHT;

  private readBuffer = Buffer.allocUnsafe(this.preview ? PREVIEW_FRAME_BYTE_SIZE : FRAME_BYTE_SIZE);

  private transitionSrc: any;

  constructor(public readonly transitionType: string, public readonly preview: boolean) {
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
    this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);

    this.transitionSrc = transitions.find((t: any) => t.name === this.transitionType);
  }

  renderTransition(fromFrame: Buffer, toFrame: Buffer, progress: number) {
    const transition = createTransition(this.gl, this.transitionSrc);
    const fromTexture = new Texture2D(this.gl, this.width, this.height, fromFrame);
    const toTexture = new Texture2D(this.gl, this.width, this.height, toFrame);
    const buffer = this.gl.createBuffer();

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, -1, 4, 4, -1]),
      this.gl.STATIC_DRAW,
    );
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    transition.draw(
      progress,
      fromTexture,
      toTexture,
      this.gl.drawingBufferWidth,
      this.gl.drawingBufferHeight,
    );

    fromTexture.dispose();
    toTexture.dispose();
  }

  getFrame(): Buffer {
    this.gl.readPixels(
      0,
      0,
      this.width,
      this.height,
      this.gl.RGBA,
      this.gl.UNSIGNED_BYTE,
      this.readBuffer,
    );

    return this.readBuffer;
  }
}

export interface IClip {
  path: string;
  loaded: boolean;
  enabled: boolean;
  scrubSprite?: string;
  startTrim: number;
  endTrim: number;
  duration?: number;
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
  videoId: string;
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
}

/**
 * Enable to use predefined clips instead of pulling from
 * the replay buffer.
 */
const TEST_MODE = false;

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
        // path.join(CLIP_DIR, 'Replay 2021-03-30 14-13-29.mp4'),
        // path.join(CLIP_DIR, 'Replay 2021-03-30 14-13-41.mp4'),
        // path.join(CLIP_DIR, 'Replay 2021-03-30 14-13-49.mp4'),
        // path.join(CLIP_DIR, 'Replay 2021-03-30 14-13-58.mp4'),
        // path.join(CLIP_DIR, 'Replay 2021-03-30 14-14-03.mp4'),
        // path.join(CLIP_DIR, 'Replay 2021-03-30 14-14-06.mp4'),
        // path.join(CLIP_DIR, 'Replay 2021-03-30 14-30-53.mp4'),
        // path.join(CLIP_DIR, 'Replay 2021-03-30 14-32-34.mp4'),
        // path.join(CLIP_DIR, 'Replay 2021-03-30 14-34-33.mp4'),
        // path.join(CLIP_DIR, 'Replay 2021-03-30 14-34-48.mp4'),
        // path.join(CLIP_DIR, 'Replay 2021-03-30 14-35-03.mp4'),
        // path.join(CLIP_DIR, 'Replay 2021-03-30 14-35-23.mp4'),
        // path.join(CLIP_DIR, 'Replay 2021-03-30 14-35-51.mp4'),
        // path.join(CLIP_DIR, 'Replay 2021-03-30 14-36-18.mp4'),
        // path.join(CLIP_DIR, 'Replay 2021-03-30 14-36-30.mp4'),
        // path.join(CLIP_DIR, 'Replay 2021-03-30 14-36-44.mp4'),
        // Razer blade test clips
        path.join(CLIP_DIR, '2021-05-25 08-55-13.mp4'),
        path.join(CLIP_DIR, '2021-06-08 16-40-14.mp4'),
        path.join(CLIP_DIR, '2021-05-25 08-56-03.mp4'),
      ];

      clipsToLoad.forEach(c => {
        this.ADD_CLIP({ path: c, loaded: false, enabled: true, startTrim: 0, endTrim: 0 });
      });
    } else {
      this.streamingService.replayBufferFileWrite.subscribe(clipPath => {
        this.ADD_CLIP({ path: clipPath, loaded: false, enabled: true, startTrim: 0, endTrim: 0 });
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
          scrubSprite: this.clips[completed.path].frameSource.scrubJpg,
          duration: this.clips[completed.path].duration,
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

    const clips = this.views.clips
      .filter(c => c.enabled)
      .map(c => {
        const clip = this.clips[c.path];

        // Set trims on the frame source
        clip.startTrim = c.startTrim;
        clip.endTrim = c.endTrim;

        return clip;
      });

    if (!clips.length) {
      console.error('Highlighter: Export called without any clips!');
      return;
    }

    // Reset all clips
    clips.forEach(c => c.reset(preview));

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
        this.SET_EXPORT_INFO({ currentFrame: this.state.export.currentFrame + 1 });
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

  cancelFunction: () => void = null;

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
    let result: IYoutubeUploadResponse;

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
