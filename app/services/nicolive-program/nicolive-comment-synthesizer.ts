import { mutation, StatefulService } from 'services/core/stateful-service';
import { Inject } from 'services/core/injector';
import { NicoliveProgramStateService } from './state';
import { ParaphraseDictionary } from './ParaphraseDictionary';
import { WrappedChat } from './WrappedChat';
import { getDisplayText } from './ChatMessage/displaytext';
import { AddComponent } from './ChatMessage/ChatComponentType';

export type Speech = {
  text: string;
  pitch?: number;
  rate?: number;
  volume?: number;
};

interface ICommentSynthesizerState {
  enabled: boolean;
  pitch: number; // SpeechSynthesisUtterance.pitch; 0.1(lowest) to 2(highest) (default: 1)
  rate: number; // SpeechSynthesisUtterence.rate; 0.1(lowest) to 10(highest); default:1
  volume: number; // SpeechSynthesisUtterance.volume; 0.1(lowest) to 1(highest)
}

export class NicoliveCommentSynthesizerService extends StatefulService<ICommentSynthesizerState> {
  @Inject('NicoliveProgramStateService') stateService: NicoliveProgramStateService;

  static initialState: ICommentSynthesizerState = {
    enabled: true,
    pitch: 1,
    rate: 1,
    volume: 1,
  };

  init(): void {
    this.stateService.updated.subscribe({
      next: persistentState => {
        const newState =
          persistentState.speechSynthesizerSettings ||
          NicoliveCommentSynthesizerService.initialState;
        this.SET_STATE(newState);
      },
    });
  }

  private setEnabled(enabled: boolean) {
    this.setState({ enabled });
  }
  get enabled(): boolean {
    return this.state.enabled;
  }
  set enabled(e: boolean) {
    this.setEnabled(e);
  }

  private setPitch(pitch: number) {
    this.setState({ pitch });
  }
  get pitch(): number {
    return this.state.pitch;
  }
  set pitch(p: number) {
    this.setPitch(p);
  }

  private setRate(rate: number) {
    this.setState({ rate });
  }
  get rate(): number {
    return this.state.rate;
  }
  set rate(r: number) {
    this.setRate(r);
  }

  private setVolume(volume: number) {
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
    const r = this.synth.makeSpeechText(chat);
    if (r === '') {
      return null;
    }
    return {
      pitch: this.state.pitch,
      rate: this.state.rate,
      volume: this.state.volume,
      text: r,
    };
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

  speakText(
    speech: Speech,
    onstart: (this: SpeechSynthesisUtterance, ev: SpeechSynthesisEvent) => void,
    onend: (this: SpeechSynthesisUtterance, ev: SpeechSynthesisEvent) => void,
  ) {
    if (!this.enabled) {
      return;
    }
    this.synth.speakText(speech, onstart, onend);
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
    return window.speechSynthesis !== undefined;
  }

  makeSpeechText(chat: WrappedChat): string {
    if (!chat.value || !chat.value.content) {
      return '';
    }
    const text = getDisplayText(AddComponent(chat));

    const converted = this.dictionary.process(text);

    return converted;
  }

  speakText(
    speech: Speech,
    onstart: (this: SpeechSynthesisUtterance, ev: SpeechSynthesisEvent) => void,
    onend: (this: SpeechSynthesisUtterance, ev: SpeechSynthesisEvent) => void,
  ) {
    if (!speech || speech.text === '' || !this.available) {
      return;
    }

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
