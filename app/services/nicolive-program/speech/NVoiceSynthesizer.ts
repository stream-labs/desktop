import { WaitNotify } from '../../../util/WaitNotify';
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

  private _playQueue: {
    start: (() => Promise<{
      cancel: () => Promise<void>;
      speaking: Promise<void>;
    } | null>); label: string;
  }[] = [];
  private _playing: {
    cancel: () => Promise<void>;
    speaking: Promise<void>;
    state: 'preparing' | 'playing';
  } | null = null;
  private runQueue() {
    setTimeout(() => this._runQueue(), 0);
  }
  private _waitForSpeakEnd = new WaitNotify();

  private async _runQueue() {
    if (this._playing) {
      return;
    }
    const next = this._playQueue.shift();
    if (next) {
      const { start, label } = next;
      if (start) {
        let earlyCancel = false;
        let resolveSpeaking2: () => void = () => { };
        const speaking2 = new Promise<void>((resolve) => { resolveSpeaking2 = resolve; });
        speaking2.then(() => {
          this._playing = null;
          this.runQueue();
        });
        this._playing = {
          cancel: async () => {
            this._playing.cancel = async () => { await speaking2; };
            earlyCancel = true;
            await speaking2;
          },
          speaking: speaking2,
          state: 'preparing',
        };
        start().then((r) => {
          if (!r) {
            resolveSpeaking2();
          } else {
            const { cancel, speaking } = r;
            if (earlyCancel) {
              cancel().then(() => {
                resolveSpeaking2();
              });
            } else {
              this._playing = {
                cancel: async () => {
                  this._playing.cancel = async () => { await speaking2; };
                  await cancel();
                  await speaking2;
                },
                speaking: speaking.then(() => {
                  resolveSpeaking2();
                }),
                state: 'playing',
              };
            }
          }
        });
      }
    } else {
      this._waitForSpeakEnd.notify();
    }
  }
  private async _cancelQueue() {
    // 実行中のものはキャンセルし、キューに残っているものは削除する
    this._playQueue = [];
    if (this._playing) {
      await this._playing.cancel();
    }
  }
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
          speaking: r.speaking,
        };
      } catch (error) {
        console.error(`NVoiceSynthesizer: text:${JSON.stringify(speech.text)} -> ${error}`);
      }
    };
    if (force) {
      this._cancelQueue();
    }
    this._playQueue.push({ start, label: speech.text });
    this.runQueue();
  }

  get speaking(): boolean {
    return this._playing !== null || this._playQueue.length > 0;
  }

  async waitForSpeakEnd(): Promise<void> {
    if (!this.speaking) {
      return;
    }
    return this._waitForSpeakEnd.wait();
  }

  async cancelSpeak() {
    await this._cancelQueue();
  }

  // for testing
  get playState(): 'preparing' | 'playing' | null {
    return this._playing ? this._playing.state : null;
  }

  // for testing
  get queueLength(): number {
    return this._playQueue.length;
  }
}
