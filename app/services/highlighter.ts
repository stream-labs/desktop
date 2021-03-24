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

const WIDTH = 1280;
const HEIGHT = 720;
const FPS = 15;

// Frames are RGBA, 4 bytes per pixel
const FRAME_BYTE_SIZE = WIDTH * HEIGHT * 4;

export class FrameSource {
  writeBuffer = Buffer.allocUnsafe(FRAME_BYTE_SIZE);
  readBuffer = Buffer.allocUnsafe(FRAME_BYTE_SIZE);
  private byteIndex = 0;

  readonly width = WIDTH;
  readonly height = HEIGHT;

  private ffmpeg: execa.ExecaChildProcess<string>;

  private onFrameComplete: () => void;

  constructor(public readonly sourcePath: string) {}

  private startFfmpeg() {
    console.log(FFMPEG_EXE);

    /* eslint-disable */
    const args = [
      '-i', CLIP_1,
      '-vf', `fps=${FPS}`,
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
    });

    this.ffmpeg.stdout.on('data', (chunk: Buffer) => {
      console.log('GOT CHUNK LENGTH', chunk.length);

      this.handleChunk(chunk);
    });

    this.ffmpeg.stdout.on('error', e => {
      console.log(e);
    });
  }

  readNextFrame() {
    return new Promise<void>((resolve, reject) => {
      if (!this.ffmpeg) this.startFfmpeg();

      if (this.onFrameComplete) {
        console.log('Cannot read next frame while frame read is in progress');
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

    console.log('BYTE INDEX', this.byteIndex, FRAME_BYTE_SIZE);

    if (this.byteIndex >= FRAME_BYTE_SIZE) {
      this.ffmpeg.stdout.pause();

      console.log('FRAME BUFFER IS FILLED');
      this.swapBuffers();

      this.onFrameComplete();
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

export class HighlighterService extends Service {}
