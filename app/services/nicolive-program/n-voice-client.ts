// N Voice Client Service

import electron from 'electron';
import { existsSync, readFileSync, unlinkSync } from 'fs';
import { join } from "path";
import { StatefulService } from "services/core/stateful-service";
import { sleep } from 'util/sleep';
import { getNVoicePath, NVoiceClient } from './NVoiceClient';

/** play audio from Buffer as wave file.
 * @return .cancel function to stop playing.
 * @return .done promise to wait until playing is completed.
 */
async function playAudio(buffer: Buffer, volume: number = 1.0): Promise<{ cancel: () => void; done: Promise<void> }> {
  const url = URL.createObjectURL(new Blob([buffer]));
  let cancel: () => void;

  let completed = false;
  const done = new Promise<void>((resolve, reject) => {
    const audio = new Audio(url);
    audio.volume = volume;
    audio.addEventListener('error', () => {
      reject(audio.error);
    });
    audio.addEventListener('ended', () => {
      resolve();
    });
    cancel = () => {
      if (!completed) {
        audio.pause();
        resolve();
      }
    }
    return audio.play();
  }).finally(() => {
    completed = true;
    URL.revokeObjectURL(url);
  });
  return {
    cancel,
    done,
  };
}

interface INVoiceClientState {
  enabled: boolean;
}

export class NVoiceClientService extends StatefulService<INVoiceClientState> {

  static initialState: INVoiceClientState = {
    enabled: true,
  };

  private client: NVoiceClient;

  init(): void {
    this.client = new NVoiceClient({ baseDir: getNVoicePath() });
  }

  private index = 0;
  private speaking: Promise<void> | undefined;

  async talk(text: string, options: { speed: number; volume: number; maxTime: number; phonemeCallback?: (phoneme: string) => void }): Promise<{ cancel: () => void; speaking: Promise<void> }> {
    const client = this.client;
    const tempDir = electron.remote.app.getPath('temp');
    const wavFileName = join(tempDir, `n-voice-talk-${this.index}.wav`);
    const labelFileName = wavFileName + '.txt';
    this.index++;
    // TODO transaction
    await client.set_max_time(options.maxTime); // TODO 変わらないときは省略したい
    await client.talk(options.speed, text, wavFileName);
    const buffer = readFileSync(wavFileName);
    if (existsSync(wavFileName)) {
      unlinkSync(wavFileName);
    }
    const labels = loadLabelFile(labelFileName);
    if (existsSync(labelFileName)) {
      unlinkSync(labelFileName);
    }
    console.log('NVoiceClientService.talk label:\n', labels); // DEBUG

    if (this.speaking) {
      await this.speaking;
    }

    const startTime = Date.now();
    const { cancel, done } = await playAudio(buffer, options.volume);
    let phonemeCancel = false;
    if (options.phonemeCallback) {
      const phonemeLoop = async () => {
        for (const label of labels) {
          const elapsed = Date.now() - startTime;
          const start = label.start * 1000;
          if (start > elapsed) {
            await sleep(start - elapsed);
          }
          if (phonemeCancel) {
            break;
          }
          options.phonemeCallback(label.phoneme);
        }
        options.phonemeCallback(''); // done
      }
      phonemeLoop();
    }
    this.speaking = done;
    return {
      cancel: () => { phonemeCancel = true; cancel() },
      speaking: this.speaking,
    };
  }
};

type Label = {
  start: number;
  end: number;
  phoneme: string;
};
function loadLabelFile(filename: string): Label[] {
  const labels = readFileSync(filename, 'utf8');
  const lines = labels.split('\n').filter(line => line.length > 0);
  const result: Label[] = [];
  for (const line of lines) {
    const [start, end, phoneme] = line.split('\t');
    result.push({
      start: parseFloat(start),
      end: parseFloat(end),
      phoneme,
    });
  }
  return result;
}
