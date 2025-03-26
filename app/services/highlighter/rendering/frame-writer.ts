import execa from 'execa';
import { IExportOptions } from '../models/rendering.models';
import { FADE_OUT_DURATION, FFMPEG_EXE } from '../constants';
import { FrameWriteError } from './errors';
import fs from 'fs-extra';
import path from 'path';

export class FrameWriter {
  constructor(
    public readonly outputPath: string,
    public readonly audioInput: string,
    public readonly duration: number,
    public readonly options: IExportOptions,
  ) {}

  private ffmpeg: execa.ExecaChildProcess<Buffer | string>;

  exitPromise: Promise<void>;

  private async startFfmpeg() {
    /* eslint-disable */
    const args = [
      // Video Input
      '-f',
      'rawvideo',
      '-vcodec',
      'rawvideo',
      '-pix_fmt',
      'rgba',
      '-s',
      `${this.options.width}x${this.options.height}`,
      '-r',
      `${this.options.fps}`,
      '-i',
      '-',

      // Audio Input

      // Input Mapping
      // '-map',
      // '0:v:0',
    ];
    if (this.options.subtitles || true) {
      console.log('adding subtitles');

      await this.addSubtitleInput(args, this.options, 'transcription Class');
    }
    this.addAudioFilters(args);
    this.addVideoFilters(args, true); //!!this.options.subtitles

    args.push(
      ...[
        // Video Output
        '-vcodec',
        'libx264',
        '-profile:v',
        'high',
        '-preset:v',
        this.options.preset,
        '-crf',
        '18',
        '-movflags',
        'faststart',

        // Audio Output
        '-acodec',
        'aac',
        '-b:a',
        '128k',

        '-y',
        this.outputPath,
      ],
    );
    console.log(args.join(' '));

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
      console.log('ffmpeg:', e);
    });

    this.ffmpeg.stderr?.on('data', (data: Buffer) => {
      console.log('ffmpeg:', data.toString());
    });
  }
  //  "subtitles='C\:\\\\Users\\\\jan\\\\Videos\\\\color.srt'"
  private addVideoFilters(args: string[], addSubtitleFilter: boolean) {
    // args.push(
    //   '-filter_complex',
    //   '[0:v][1:v]overlay=0:0[final];[final]format=yuv420p,fade=type=out:duration=1:start_time=4',
    // );
    const subtitleFilter = addSubtitleFilter ? '[0:v][1:v]overlay=0:0[final];' : '';
    const fadeFilter = `${subtitleFilter}[final]format=yuv420p,fade=type=out:duration=${FADE_OUT_DURATION}:start_time=${Math.max(
      this.duration - (FADE_OUT_DURATION + 0.2),
      0,
    )}`;
    if (this.options.complexFilter) {
      args.push('-vf', this.options.complexFilter + `[final]${fadeFilter}`);
    } else {
      args.push('-filter_complex', fadeFilter);
    }
  }

  private addAudioFilters(args: string[]) {
    args.push(
      '-i',
      this.audioInput,
      '-map',
      '2:a:0',
      '-af',
      `afade=type=out:duration=${FADE_OUT_DURATION}:start_time=${Math.max(
        this.duration - (FADE_OUT_DURATION + 0.2),
        0,
      )}`,
    );
  }
  private async addSubtitleInput(args: string[], exportOptions: IExportOptions, subtitles: string) {
    subtitles = testSubtitle;
    const subtitleDuration = 10;
    const exportWidth = exportOptions.width;
    const exportHeight = exportOptions.height;
    // this.outputPath
    const subtitleDirectory = path.join(path.dirname(this.outputPath), 'temp_subtitles');
    if (!fs.existsSync(subtitleDirectory)) {
      fs.mkdirSync(subtitleDirectory, { recursive: true });
    }

    // const subtitlePath = path.join(subtitleDirectory, 'subtitle.srt');
    // // await fs.writeFile(subtitlePath, subtitles);
    // console.log('subtitle path', subtitlePath);
    // // Escape backslashes in the subtitle path for ffmpeg
    // const escapedSubtitlePath = subtitlePath.replace(/\\/g, '\\\\\\\\').replace(':', '\\:');

    // console.log('escaped subtitle path', escapedSubtitlePath);
    // // create subtitle pngs

    // // ffmpeg -f lavfi -i "color=color=white@0.0:s=1280x720:r=30,format=rgba,subtitles='C\:\\\\Users\\\\jan\\\\Videos\\\\color.srt':alpha=1" -t 10 "C:\Users\jan\Videos\temp_subtitles\subtitles_%04d.png"
    // const subtitleArgs = [
    //   '-f',
    //   'lavfi',
    //   '-i',
    //   `color=color=white@0.0:s=${exportWidth}x${exportHeight}:r=30,format=rgba,subtitles=\'${escapedSubtitlePath}\':alpha=1`,
    //   '-c:v',
    //   'png',
    //   // duration of the subtitles
    //   '-t',
    //   subtitleDuration.toString(),
    //   // temp directory for the subtitle images
    //   `${subtitleDirectory}\\subtitles_%04d.png`,
    //   '-y',
    //   '-loglevel',
    //   'debug',
    // ];
    // // -f lavfi -i "color=color=white@0.0:s=1280x720:r=30,format=rgba,subtitles='C\:\\\\Users\\\\jan\\\\Videos\\\\color.srt':alpha=1" -t 10 "C:\Users\jan\Videos\temp_subtitles\subtitles_%04d.png"
    // /* eslint-enable */
    // await execa(FFMPEG_EXE, subtitleArgs);

    args.push('-i', `${subtitleDirectory}\\subtitles_%04d.png`);
  }

  async writeNextFrame(frameBuffer: Buffer) {
    if (!this.ffmpeg) await this.startFfmpeg();

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

const testSubtitle = `
1
00:00:02,000 --> 00:00:03,000
<font color="#43c42d">Hi </font><font color="#ffffff">my name is Jan and this is colorful</font>

2
00:00:03,000 --> 00:00:04,000
Hi <font color="#43c42d">my </font><font color="#ffffff">name is Jan and this is colorful</font>

3
00:00:04,000 --> 00:00:05,000
Hi my <font color="#43c42d">name </font><font color="#ffffff">is Jan and this is colorful</font>

4
00:00:05,000 --> 00:00:06,000
Hi my name <font color="#43c42d">is </font><font color="#ffffff">Jan and this is colorful</font>

5
00:00:06,000 --> 00:00:07,000
Hi my name is <font color="#43c42d">Jan </font><font color="#ffffff">and this is colorful</font>

6
00:00:07,000 --> 00:00:08,000
Hi my name is Jan <font color="#43c42d">and </font><font color="#ffffff">this is colorful</font>

7
00:00:08,000 --> 00:00:09,000
Hi my name is Jan and <font color="#43c42d">this </font><font color="#ffffff">is colorful</font>

8
00:00:09,000 --> 00:00:10,000
Hi my name is Jan and this <font color="#43c42d">is </font><font color="#ffffff">colorful</font>

9
00:00:10,000 --> 00:00:11,000
Hi my name is Jan and this is <font color="#43c42d">colorful</font><font color="#ffffff"></font>

`;
