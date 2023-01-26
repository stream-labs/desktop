import { NVoiceClientService } from '../n-voice-client';
import { WaitNotify } from './WaitNotify';
import { ISpeechSynthesizer } from './ISpeechSynthesizer';
import { Speech } from '../nicolive-comment-synthesizer';


export class NVoiceSynthesizer implements ISpeechSynthesizer {
  constructor(private nVoiceClientService: NVoiceClientService) { }

  private _playQueue: { start: (() => Promise<{ cancel: () => Promise<void>; speaking: Promise<void>; }>); label: string; }[] = [];
  private _playing: { cancel: () => Promise<void>; speaking: Promise<void>; } | null = null;
  private runQueue() {
    setTimeout(() => this._runQueue(), 0);
  }
  private _waitForSpeakEnd = new WaitNotify();

  private async _runQueue() {
    if (this._playing) {
      return;
    }
    console.log('run queue', this._playQueue.map(i => i.label)); // DEBUG
    const next = this._playQueue.shift();
    if (next) {
      const { start, label } = next;
      console.log('queue after shift', this._playQueue.map(i => i.label)); // DEBUG
      if (start) {
        let earlyCancel = false;
        let resolveSpeaking2: () => void = () => { };
        const speaking2 = new Promise<void>((resolve) => { resolveSpeaking2 = resolve; });
        speaking2.then(() => {
          console.log(`${label}: _playing = null`); // DEBUG
          this._playing = null;
          this.runQueue();
        });
        this._playing = {
          cancel: async () => {
            this._playing.cancel = async () => { await speaking2; };
            console.log(`${label}: early cancel`); // DEBUG
            earlyCancel = true;
            await speaking2;
          },
          speaking: speaking2,
        };
        console.log(`${label}: start playing(1)`); // DEBUG
        start().then(({ cancel, speaking }) => {
          if (earlyCancel) {
            console.log(`${label}: early cancel applied`); // DEBUG
            cancel().then(() => {
              console.log(`${label}: early cancel applied -> resolveSpeaking2`); // DEBUG
              resolveSpeaking2();
            });
          } else {
            this._playing = {
              cancel: async () => {
                this._playing.cancel = async () => { await speaking2; };
                console.log(`${label}: cancel playing`); // DEBUG
                await cancel();
                await speaking2;
              },
              speaking: speaking.then(() => {
                console.log(`${label}: play complete -> resolveSpeaking2`); // DEBUG
                resolveSpeaking2();
              }
              )
            };
            console.log(`${label}: start playing(2)`); // DEBUG
          }
        });
      }
    } else {
      this._waitForSpeakEnd.notify();
    }
  }
  private async _cancelQueue() {
    // 実行中のものはキャンセルし、キューに残っているものは削除する
    console.log('cancel queue', !!this._playing, this._playQueue); // DEBUG
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
        const r = await this.nVoiceClientService.talk(speech.text, {
          speed: 1 / (speech.rate || 1),
          volume: speech.volume,
          maxTime: speech.nVoice.maxTime,
          phonemeCallback: (phoneme: string) => {
            console.log(phoneme); // DEBUG
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
            console.log('キャンセル実行'); // DEBUG
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
    console.log('after push queue', this._playing, this._playQueue.map(i => i.label)); // DEBUG
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
}
