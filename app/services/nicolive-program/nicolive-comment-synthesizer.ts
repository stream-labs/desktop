import { mutation, StatefulService } from 'services/stateful-service';
import { WrappedChat } from './nicolive-comment-viewer';
import replace_rules from './replace_rules.json';

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
}

interface ICommentSynthesizerState {
  pitch: number; // SpeechSynthesisUtterance.pitch; 0(lowest) to 2(highest) (default: 1)
  rate: number; // SpeechSynthesisUtterence.rate; 0.1(lowest) to 10(highest); default:1
};

export class NicoliveCommentSynthesizerService extends StatefulService<ICommentSynthesizerState> {
  static initialState: ICommentSynthesizerState = {
    pitch: 1,
    rate: 1,
  }

  setPitch(pitch: number) {
    this.setState({pitch});
  }

  setRate(rate: number) {
    this.setState({rate});
  }

  private setState(partialState: Partial<ICommentSynthesizerState>) {
    const nextState = { ...this.state, ...partialState };
    this.SET_STATE(nextState);
  }
  
  @mutation()
  private SET_STATE(nextState: ICommentSynthesizerState): void {
    this.state = nextState;
  }

  // delegate synth
  synth = new NicoliveCommentSynthesizer();

  makeSpeech(chat: WrappedChat): Speech | null {
    console.log(`makeSpeech proxy: ${chat}`);
    const r = this.synth.makeSpeech(chat);
    if (r) {
      return {
        pitch: this.state.pitch,
        rate: this.state.rate,
        ...r,
      };
    }
    return r;
  }

  speakText(speech: Speech,
    onstart: (this: SpeechSynthesisUtterance, ev: SpeechSynthesisEvent) => any,
    onend: (this: SpeechSynthesisUtterance, ev: SpeechSynthesisEvent) => any
  ) {
    return this.synth.speakText(speech, onstart, onend);
  }
}

export class NicoliveCommentSynthesizer {
  dictionary = new ParaphraseDictionary();

  makeSpeech(chat: WrappedChat): Speech | null {
    if (!chat.value || !chat.value.content) {
      return null;
    }
    console.log(`makeSpeech: ${chat.value.content} -> ${this.dictionary.process(chat.value.content)}`);

    return {
      text: this.dictionary.process(chat.value.content)
    };
  }

  speakText(speech: Speech,
    onstart: (this: SpeechSynthesisUtterance, ev: SpeechSynthesisEvent) => any,
    onend: (this: SpeechSynthesisUtterance, ev: SpeechSynthesisEvent) => any
  ) {
    if (!speech || speech.text == '') {
      return;
    }
    console.log(`speechText: ${speech.text}`);

    const uttr = new SpeechSynthesisUtterance(speech.text);
    uttr.pitch = speech.pitch || 1;
    uttr.rate = speech.rate || 1;
    uttr.onstart = onstart;
    uttr.onend = onend;
    speechSynthesis.speak(uttr);
  }
}
