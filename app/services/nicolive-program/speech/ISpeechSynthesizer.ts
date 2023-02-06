import { Speech } from '../nicolive-comment-synthesizer';


export interface ISpeechSynthesizer {
  speakText(
    speech: Speech,
    onstart: () => void,
    onend: () => void,
    force?: boolean,
    onPhoneme?: (phoneme: string) => void,
  ): void;
  speaking: boolean;
  cancelSpeak(): Promise<void>;
  waitForSpeakEnd(): Promise<void>;
}
