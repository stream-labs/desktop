import execa from 'execa';
import fs from 'fs';
import { FFMPEG_EXE } from './constants';
import { Clip } from './clip';

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
