import { QueueRunner } from 'util/QueueRunner';
import { Speech } from '../nicolive-comment-synthesizer';
import { ISpeechSynthesizer } from './ISpeechSynthesizer';


export interface INVoiceTalker {
  talk(
    text: string,
    options: {
      speed: number;
      volume: number;
      maxTime: number;
      phonemeCallback?: (phoneme: string) => void,
    },
  ): Promise<{ cancel: () => void; speaking: Promise<void> } | null>;
}

export class NVoiceSynthesizer implements ISpeechSynthesizer {
  constructor(private nVoiceTalker: INVoiceTalker) { }

  private queue = new QueueRunner();

  speakText(
    speech: Speech,
    onstart: () => void,
    onend: () => void,
    force = false,
    onPhoneme?: (phoneme: string) => void,
  ) {
    const start = async () => {
      try {
        const r = await this.nVoiceTalker.talk(speech.text, {
          speed: 1 / (speech.rate || 1),
          volume: speech.volume,
          maxTime: speech.nVoice?.maxTime,
          phonemeCallback: (phoneme: string) => {
            if (onPhoneme) {
              onPhoneme(phoneme);
            }
          },
        });
        if (r === null) {
          // no sound
          return;
        }
        (async () => {
          onstart();
          await r.speaking;
          onend();
        })();
        return {
          cancel: async () => {
            r.cancel();
            await r.speaking;
          },
          running: r.speaking,
        };
      } catch (error) {
        console.error(`NVoiceSynthesizer: text:${JSON.stringify(speech.text)} -> ${error}`);
      }
    };
    if (force) {
      this.queue.cancel();
    }
    this.queue.add(start, speech.text);
    this.queue.runNext();
  }

  get speaking(): boolean {
    return this.queue.running;
  }

  async waitForSpeakEnd(): Promise<void> {
    if (!this.speaking) {
      return;
    }
    return this.queue.waitUntilFinished();
  }

  async cancelSpeak() {
    await this.queue.cancel();
  }

  // for testing
  get playState(): 'preparing' | 'playing' | null {
    switch (this.queue.state) {
      case 'preparing':
        return 'preparing';
      case 'running':
        return 'playing';
      default:
        return null;
    }
  }

  // for testing
  get queueLength(): number {
    return this.queue.length;
  }
}
