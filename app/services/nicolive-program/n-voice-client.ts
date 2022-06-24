// N Voice Client Service

import electron from 'electron';
import { readFileSync, unlinkSync } from 'fs';
import { join } from "path";
import { StatefulService } from "services/core/stateful-service";
import { getNVoicePath, NVoiceClient } from './NVoiceClient';

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

  async talk(text: string, options: { speed: number; volume: number; maxTime: number }): Promise<{ cancel: () => void; speaking: Promise<void> }> {
    const client = this.client;
    const tempDir = electron.remote.app.getPath('temp');
    const wavFileName = join(tempDir, `n-voice-talk-${this.index}.wav`);
    this.index++;
    // TODO transaction
    await client.set_max_time(options.maxTime); // TODO 変わらないときは省略したい
    await client.talk(options.speed, text, wavFileName);
    const buffer = readFileSync(wavFileName);
    unlinkSync(wavFileName);

    if (this.speaking) {
      await this.speaking;
    }
    const { cancel, done } = await playAudio(buffer, options.volume);
    this.speaking = done;
    return { cancel, speaking: this.speaking };
  }
};
