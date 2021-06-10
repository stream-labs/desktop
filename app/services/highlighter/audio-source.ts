import path from 'path';
import fs from 'fs';
import execa from 'execa';
import { FFMPEG_EXE } from './constants';

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
