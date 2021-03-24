import { Service } from 'services/core';
import path from 'path';
import execa from 'execa';

const FFMPEG_DIR = path.resolve('../../', 'Downloads', 'ffmpeg', 'bin');
const FFMPEG_EXE = path.join(FFMPEG_DIR, 'ffmpeg.exe');
const FFPROBE_EXE = path.join(FFMPEG_DIR, 'ffprobe.exe');

const CLIP_DIR = path.resolve('../../', 'Videos');
export const CLIP_1 = path.join(CLIP_DIR, '1.mp4');
export const CLIP_2 = path.join(CLIP_DIR, '2.mp4');
export const CLIP_3 = path.join(CLIP_DIR, '3.mp4');
const EXPORT_FILE = path.join(CLIP_DIR, 'output.mp4');

const WIDTH = 1280;
const HEIGHT = 720;
const FPS = 30;

// Frames are RGBA, 4 bytes per pixel
const FRAME_BYTE_SIZE = WIDTH * HEIGHT * 4;

export class FrameSource {
  writeBuffer = Buffer.allocUnsafe(FRAME_BYTE_SIZE);
  readBuffer = Buffer.allocUnsafe(FRAME_BYTE_SIZE);
  private byteIndex = 0;

  readonly width = WIDTH;
  readonly height = HEIGHT;

  private ffmpeg: execa.ExecaChildProcess<string>;

  private onFrameComplete: (frameRead: boolean) => void;

  private finished = false;

  constructor(public readonly sourcePath: string) {}

  private startFfmpeg() {
    /* eslint-disable */
    const args = [
      '-i', this.sourcePath,
      '-vf', `fps=${FPS},scale=${this.width}:${this.height}`,
      '-map', 'v:0',
      '-vcodec', 'rawvideo',
      '-pix_fmt', 'rgba',
      '-f', 'image2pipe',
      '-'
    ];
    /* eslint-enable */

    console.log(args);

    this.ffmpeg = execa(FFMPEG_EXE, args, {
      encoding: null,
      buffer: false,
      stdin: 'ignore',
      stdout: 'pipe',
      stderr: process.stderr,
    });

    this.ffmpeg.stdout.once('end', () => {
      console.log('STREAM HAS ENDED');
      this.finished = true;

      // If a frame request is in progress, immediately resolve it
      if (this.onFrameComplete) this.onFrameComplete(false);
    });

    this.ffmpeg.stdout.on('data', (chunk: Buffer) => {
      // console.log('GOT CHUNK LENGTH', chunk.length);

      this.handleChunk(chunk);
    });

    this.ffmpeg.stdout.on('error', e => {
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

      this.ffmpeg.stdout.resume();
    });
  }

  handleChunk(chunk: Buffer) {
    // If the chunk is larger than what's needed to fill the rest of the frame buffer,
    // only copy enough to fill the buffer.
    const bytesToCopy =
      this.byteIndex + chunk.length > FRAME_BYTE_SIZE
        ? FRAME_BYTE_SIZE - this.byteIndex
        : chunk.length;

    chunk.copy(this.writeBuffer, this.byteIndex, 0, bytesToCopy);
    this.byteIndex += bytesToCopy;

    if (this.byteIndex >= FRAME_BYTE_SIZE) {
      this.ffmpeg.stdout.pause();

      console.log('FRAME BUFFER IS FILLED');
      this.swapBuffers();

      this.onFrameComplete(true);
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

export class FrameWriter {
  constructor(public readonly outputPath: string) {}

  readonly width = WIDTH;
  readonly height = HEIGHT;

  private ffmpeg: execa.ExecaChildProcess<string>;

  private startFfmpeg() {
    /* eslint-disable */
    const args = [
      '-f', 'rawvideo',
      '-vcodec', 'rawvideo',
      '-pix_fmt', 'rgba',
      '-s', `${this.width}x${this.height}`,
      '-r', `${FPS}`,
      '-i', '-',
      '-vf', 'format=yuv420p',
      '-vcodec', 'libx264',
      '-profile:v', 'high',
      '-preset:v', 'ultrafast',
      '-crf', '18',
      '-movflags', 'faststart',
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

    this.ffmpeg.on('exit', code => {
      console.log('ffmpeg writer exited with code', code);
    });

    this.ffmpeg.catch(e => {
      console.log('CAUGHT ERROR', e);
    });

    this.ffmpeg.stderr.on('data', (data: Buffer) => {
      console.log('ffmpeg stderr:', data.toString());
    });
  }

  async writeNextFrame(frameBuffer: Buffer) {
    if (!this.ffmpeg) this.startFfmpeg();

    await new Promise<void>(resolve => {
      this.ffmpeg.stdin.write(frameBuffer, e => {
        if (e) console.log(e);
        resolve();
      });
    });
  }

  end() {
    this.ffmpeg.stdin.end();
  }
}

export class Compositor {
  private canvas = document.createElement('canvas');
  private ctx = this.canvas.getContext('2d');

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

export class HighlighterService extends Service {
  async run() {
    const sources = [new FrameSource(CLIP_1), new FrameSource(CLIP_2), new FrameSource(CLIP_3)];
    let source = sources.shift();

    const writer = new FrameWriter(EXPORT_FILE);

    const compositor = new Compositor();

    let frameCounter = 0;

    while (true) {
      console.log('Reading frame', frameCounter);
      const frameRead = await source.readNextFrame();

      if (frameRead) {
        console.log('Writing frame', frameCounter);

        compositor.drawFrame(source.readBuffer);
        compositor.drawText();

        await writer.writeNextFrame(compositor.getFrame());
      } else {
        console.log('Out of frames!');

        // Get the next source
        source = sources.shift();

        if (!source) {
          console.log('Out of sources, closing file');
          writer.end();
          break;
        }
      }

      frameCounter++;
    }
  }
}
