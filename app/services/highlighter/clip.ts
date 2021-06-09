import execa from 'execa';
import { FrameSource } from './frame-source';
import { AudioSource } from './audio-source';
import { FFPROBE_EXE } from './constants';

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
