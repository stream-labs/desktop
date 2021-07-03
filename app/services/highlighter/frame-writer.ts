import execa from 'execa';
import {
  FADE_OUT_DURATION,
  FFMPEG_EXE,
  FPS,
  HEIGHT,
  PREVIEW_HEIGHT,
  PREVIEW_WIDTH,
  WIDTH,
} from './constants';
import { FrameWriteError } from './errors';

export class FrameWriter {
  constructor(
    public readonly outputPath: string,
    public readonly audioInput: string,
    public readonly preview: boolean,
    public readonly duration: number,
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

      // Filters
      '-af', `afade=type=out:duration=${FADE_OUT_DURATION}:start_time=${this.duration - (FADE_OUT_DURATION + 0.2)}`,
      '-vf', `format=yuv420p,fade=type=out:duration=${FADE_OUT_DURATION}:start_time=${this.duration - (FADE_OUT_DURATION + 0.2)}`,

      // Video Output
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
      console.error('ffmpeg:', e);
    });

    this.ffmpeg.stderr?.on('data', (data: Buffer) => {
      console.log('ffmpeg:', data.toString());
    });
  }

  async writeNextFrame(frameBuffer: Buffer) {
    if (!this.ffmpeg) this.startFfmpeg();

    try {
      await new Promise<void>((resolve, reject) => {
        this.ffmpeg.stdin?.write(frameBuffer, e => {
          if (e) {
            reject();
            return;
          }
          resolve();
        });
      });
    } catch (e: unknown) {
      throw new FrameWriteError();
    }
  }

  end() {
    this.ffmpeg?.stdin?.end();
    return this.exitPromise;
  }
}
