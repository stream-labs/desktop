import path from 'path';
import execa from 'execa';
import {
  FFMPEG_EXE,
  FPS,
  FRAME_BYTE_SIZE,
  HEIGHT,
  PREVIEW_FRAME_BYTE_SIZE,
  PREVIEW_HEIGHT,
  PREVIEW_WIDTH,
  SCRUB_FRAMES,
  SCRUB_HEIGHT,
  SCRUB_SPRITE_DIRECTORY,
  SCRUB_WIDTH,
  WIDTH,
} from './constants';

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
