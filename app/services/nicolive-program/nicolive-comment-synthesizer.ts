import { mutation, StatefulService } from 'services/stateful-service';
import { Inject } from 'util/injector';
import { WrappedChat } from './nicolive-comment-viewer';
import replace_rules from './replace_rules.json';
import { NicoliveProgramStateService } from './state';

export class ParaphraseDictionary {
  dictionary = replace_rules.elements.map(e => ({
    pattern: new RegExp(e.regularExpression, 'i'),
    to: e.replacement
  }));

  process(input: string): string {
    return this.dictionary.reduce<string>(
      (acc, item) => acc.replace(item.pattern, item.to),
      input
    );
  }
}

export type Speech = {
  text: string;
  pitch?: number;
  rate?: number;
  volume?: number;
}

interface ICommentSynthesizerState {
  enabled: boolean;
  pitch: number; // SpeechSynthesisUtterance.pitch; 0(lowest) to 2(highest) (default: 1)
  rate: number; // SpeechSynthesisUtterence.rate; 0.1(lowest) to 10(highest); default:1
  volume: number; // SpeechSynthesisUtterance.volume; 0(lowest) to 1(highest)
};

export class NicoliveCommentSynthesizerService extends StatefulService<ICommentSynthesizerState> {
  @Inject('NicoliveProgramStateService') stateService: NicoliveProgramStateService;

  static initialState: ICommentSynthesizerState = {
    enabled: true,
    pitch: 1,
    rate: 1,
    volume: 1,
  }

  init(): void {
    this.stateService.updated.subscribe({
      next: persistentState => {
        const newState = persistentState.speechSynthesizerSettings || NicoliveCommentSynthesizerService.initialState;
        this.SET_STATE(newState);
      }
    });
  }

  setEnabled(enabled: boolean) {
    this.setState({ enabled });
  }
  get enabled(): boolean {
    return this.state.enabled;
  }
  set enabled(e: boolean) {
    this.setEnabled(e);
  }

  setPitch(pitch: number) {
    this.setState({ pitch });
  }
  get pitch(): number {
    return this.state.pitch;
  }
  set pitch(p: number) {
    this.setPitch(p);
  }

  setRate(rate: number) {
    this.setState({ rate });
  }
  get rate(): number {
    return this.state.rate;
  }
  set rate(r: number) {
    this.setRate(r);
  }

  setVolume(volume: number) {
    this.setState({ volume });
  }
  get volume(): number {
    return this.state.volume;
  }
  set volume(r: number) {
    this.setVolume(r);
  }

  private setState(partialState: Partial<ICommentSynthesizerState>) {
    const nextState = { ...this.state, ...partialState };
    this.stateService.updateSpeechSynthesizerSettings(nextState);
  }

  @mutation()
  private SET_STATE(nextState: ICommentSynthesizerState): void {
    this.state = nextState;
  }

  // delegate synth
  synth = new NicoliveCommentSynthesizer();

  makeSpeech(chat: WrappedChat): Speech | null {
    if (!this.enabled) {
      return null;
    }
    console.log(`makeSpeech proxy: ${chat}`);
    const r = this.synth.makeSpeech(chat);
    if (r) {
      return {
        pitch: this.state.pitch,
        rate: this.state.rate,
        volume: this.state.volume,
        ...r,
      };
    }
    return r;
  }

  makeSimpleTextSpeech(text: string): Speech | null {
    return this.makeSpeech({
      type: 'normal',
      value: {
        content: text,
      },
      seqId: 1,
    });
  }

  speakText(speech: Speech,
    onstart: (this: SpeechSynthesisUtterance, ev: SpeechSynthesisEvent) => any,
    onend: (this: SpeechSynthesisUtterance, ev: SpeechSynthesisEvent) => any
  ) {
    return this.synth.speakText(speech, onstart, onend);
  }

  get speaking(): boolean {
    return this.synth.speaking;
  }

  cancelSpeak() {
    this.synth.cancelSpeak();
  }
}

export class NicoliveCommentSynthesizer {
  dictionary = new ParaphraseDictionary();

  get available(): boolean {
    return window.speechSynthesis !== undefined
  }

  makeSpeech(chat: WrappedChat): Speech | null {
    if (!chat.value || !chat.value.content) {
      return null;
    }

    const converted = this.dictionary.process(chat.value.content);
    if (converted === chat.value.content) {
      console.log(`makeSpeech: ${chat.value.content}`);
    } else {
      console.log(`makeSpeech: ${chat.value.content} -> ${converted}`);
    }

    return {
      text: converted,
    };
  }

  speakText(speech: Speech,
    onstart: (this: SpeechSynthesisUtterance, ev: SpeechSynthesisEvent) => any,
    onend: (this: SpeechSynthesisUtterance, ev: SpeechSynthesisEvent) => any
  ) {
    if (!speech || speech.text == '' || !this.available) {
      return;
    }
    console.log(`speechText: ${speech.text}`);

    const uttr = new SpeechSynthesisUtterance(speech.text);
    uttr.pitch = speech.pitch || 1;
    uttr.rate = speech.rate || 1;
    uttr.volume = speech.volume || 1;
    uttr.onstart = onstart;
    uttr.onend = onend;
    speechSynthesis.speak(uttr);
  }

  get speaking(): boolean {
    return this.available && speechSynthesis.speaking;
  }

  cancelSpeak() {
    if (!this.available) {
      return;
    }
    speechSynthesis.cancel();
  }
}
