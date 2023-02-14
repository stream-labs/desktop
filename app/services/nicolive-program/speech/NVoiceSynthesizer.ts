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

  speakText(
    speech: Speech,
    onstart: () => void,
    onend: () => void,
    onPhoneme?: (phoneme: string) => void,
  ) {
    return async () => {
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
  }
}
