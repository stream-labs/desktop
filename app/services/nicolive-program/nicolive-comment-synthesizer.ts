import { createServer } from 'http';
import { InitAfter, Inject } from 'services/core';
import { mutation, StatefulService } from 'services/core/stateful-service';
import { NVoiceCharacterService } from 'services/nvoice-character';
import { Server } from 'socket.io';
import { AddComponent } from './ChatMessage/ChatComponentType';
import { getDisplayText } from './ChatMessage/displaytext';
import { NVoiceClientService } from './n-voice-client';
import { ParaphraseDictionary } from './ParaphraseDictionary';
import { ISpeechSynthesizer } from './speech/ISpeechSynthesizer';
import { NVoiceSynthesizer } from './speech/NVoiceSynthesizer';
import { WebSpeechSynthesizer } from './speech/WebSpeechSynthesizer';
import { NicoliveProgramStateService, SynthesizerId } from './state';
import { WrappedChat } from './WrappedChat';

export type Speech = {
  text: string;
  synthesizer: SynthesizerId;
  rate: number; // 速度
  webSpeech?: {
    pitch?: number; // 声の高さ
  },
  volume?: number;
  nVoice?: {
    maxTime: number;
  }
};

interface ICommentSynthesizerState {
  enabled: boolean;
  pitch: number; // SpeechSynthesisUtterance.pitch; 0.1(lowest) to 2(highest) (default: 1), only for web speech
  rate: number; // SpeechSynthesisUtterence.rate; 0.1(lowest) to 10(highest); default:1
  volume: number; // SpeechSynthesisUtterance.volume; 0.1(lowest) to 1(highest)
  maxTime: number; // nVoice max time in seconds
  selector: {
    normal: SynthesizerId;
    operator: SynthesizerId;
    system: SynthesizerId;
  };
}

@InitAfter('NicoliveProgramStateService')
export class NicoliveCommentSynthesizerService extends StatefulService<ICommentSynthesizerState> {
  @Inject('NicoliveProgramStateService') stateService: NicoliveProgramStateService;
  @Inject() nVoiceClientService: NVoiceClientService;
  @Inject() nVoiceCharacterService: NVoiceCharacterService;

  static initialState: ICommentSynthesizerState = {
    enabled: true,
    pitch: 1,
    rate: 1,
    volume: 1,
    maxTime: 4,
    selector: {
      normal: 'nVoice',
      operator: 'nVoice',
      system: 'webSpeech',
    }
  };

  // delegate synth
  webSpeech = new WebSpeechSynthesizer();
  nVoice: NVoiceSynthesizer;
  getSynthesizer(id: SynthesizerId): ISpeechSynthesizer | null {
    switch (id) {
      case 'webSpeech':
        return this.webSpeech;
      case 'nVoice':
        return this.nVoice;
      default:
        return null;
    }
  }

  currentPlayingId: SynthesizerId | null = null;
  currentPlaying(): ISpeechSynthesizer | null {
    return this.currentPlayingId ? this.getSynthesizer(this.currentPlayingId) : null;
  }

  io: Server;

  init(): void {
    /*
    // 後から追加された属性がなければ追加する
    if (this.state.selector === undefined || this.state.maxTime === undefined) {
      console.log('NicoliveCommentSynthesizerService: init', this.state); // DEBUG
      this.SET_STATE({
        ...NicoliveCommentSynthesizerService.initialState.selector,
        ...this.state,
      });
    }
    */
    this.setState({ ...NicoliveCommentSynthesizerService.initialState, ...this.stateService.state.speechSynthesizerSettings });

    this.stateService.updated.subscribe({
      next: persistentState => {
        const newState =
          {
            ...NicoliveCommentSynthesizerService.initialState,
            ...persistentState.speechSynthesizerSettings
          } ||
          NicoliveCommentSynthesizerService.initialState;
        this.SET_STATE(newState);
      },
    });
    this.nVoice = new NVoiceSynthesizer(this.nVoiceClientService);
    // TODO このサーバーたてるあたりはリファクタで外に出す
    try {
      const server = createServer();
      server.listen(() => {
        const address = server.address();
        if (typeof address === 'object') {
          console.log('NVoiceCommentSynthesizerService: socket.io listening on', address.port);
          this.nVoiceCharacterService.updateSocketIoPort(address.port);
        }
      });
      this.io = new Server(server, {
        transports: ['polling'],
        cors: {
          origin: '*',
        }
      });
      this.io.on('connection', (socket) => {
        console.log('NicoliveCommentSynthesizerService Socket', socket.id, 'connected'); // DEBUG
        socket.conn.on('active', (active) => {
          console.log('NicoliveCommentSynthesizerService Socket', socket.id, 'active', active); // DEBUG
        });
        socket.conn.on('close', () => {
          console.log('NicoliveCommentSynthesizerService Socket', socket.id, 'closed'); // DEBUG
        })
      });
    } catch (e) {
      console.error('socket.io constructor error', e);
    }
  }

  private dictionary = new ParaphraseDictionary();

  makeSpeechText(chat: WrappedChat, engine: 'webSpeech' | 'nVoice'): string {
    if (!chat.value || !chat.value.content) {
      return '';
    }
    const text = getDisplayText(AddComponent(chat));

    const converted = this.dictionary.process(text, engine);

    return converted;
  }

  private selectSpeechSynthesizer(chat: WrappedChat): SynthesizerId {
    switch (chat.type) {
      case 'normal':
        return this.state.selector.normal;
      case 'operator':
        return this.state.selector.operator;
      default:
        return this.state.selector.system;
    }
  }

  makeSpeech(chat: WrappedChat, synthId?: SynthesizerId): Speech | null {
    const synthesizer = synthId || this.selectSpeechSynthesizer(chat);

    const r = this.makeSpeechText(chat, synthesizer);
    if (r === '') {
      return null;
    }
    return {
      rate: this.state.rate,
      synthesizer,
      volume: this.state.volume,
      webSpeech: {
        pitch: this.state.pitch,
      },
      nVoice: {
        maxTime: this.state.maxTime,
      },
      text: r,
    };
  }

  makeSimpleTextSpeech(text: string, synthId?: SynthesizerId): Speech | null {
    return this.makeSpeech({
      type: 'normal',
      value: {
        content: text,
      },
      seqId: 1,
    }, synthId);
  }

  async startSpeakingSimple(speech: Speech) {
    // empty anonymous functions must be created in this service
    await this.startSpeaking(speech, () => { }, () => { }, true);
  }

  async startTestSpeech(text: string, synthId: SynthesizerId) {
    console.log('testSpeech', text, synthId); // DEBUG
    const speech = this.makeSimpleTextSpeech(text, synthId);
    if (speech) {
      await this.startSpeakingSimple(speech);
    }
  }

  async startSpeaking(
    speech: Speech,
    onstart: () => void,
    onend: () => void,
    cancelBeforeSpeaking = false,
  ) {
    if (!this.enabled) {
      return;
    }

    const toPlay = speech.synthesizer;
    const toPlaySynth = this.getSynthesizer(toPlay);

    if (this.currentPlayingId !== null) {
      if (this.currentPlayingId !== toPlay) {
        if (cancelBeforeSpeaking) {
          await this.currentPlaying()?.cancelSpeak();
        } else {
          await this.currentPlaying()?.waitForSpeakEnd();
        }
      }
    }

    const playing = this.currentPlaying();
    this.currentPlayingId = toPlay;
    const force = cancelBeforeSpeaking && playing && playing.speaking;
    console.log(`${speech.text}: speakText`); // DEBUG
    toPlaySynth.speakText(speech, () => {
      onstart();
      this.currentPlayingId = toPlay;
    }, () => {
      this.currentPlayingId = null;
      onend();
    }, force,
      (phoneme) => {
        if (this.io) {
          this.io.emit('phoneme', phoneme);
        }
      });
  }

  get speaking(): boolean {
    return this.currentPlayingId !== null; // DEBUG
    // return this.currentPlaying()?.speaking || false;
  }

  async cancelSpeak() {
    console.log('cancelSpeak(): currentPlaying', this.currentPlaying()); // DEBUG
    await this.currentPlaying()?.cancelSpeak();
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

  private setMaxTime(maxTime: number) {
    this.setState({ maxTime });
  }
  get maxTime(): number {
    return this.state.maxTime || NicoliveCommentSynthesizerService.initialState.maxTime;
  }
  set maxTime(m: number) {
    this.setMaxTime(m);
  }

  // selector accessor
  get normal(): SynthesizerId {
    return this.state.selector.normal;
  }
  set normal(s: SynthesizerId) {
    this.setState({ selector: { ...this.state.selector, normal: s } });
  }
  get operator(): SynthesizerId {
    return this.state.selector.operator;
  }
  set operator(s: SynthesizerId) {
    this.setState({ selector: { ...this.state.selector, operator: s } });
  }
  get system(): SynthesizerId {
    return this.state.selector.system;
  }
  set system(s: SynthesizerId) {
    this.setState({ selector: { ...this.state.selector, system: s } });
  }

  private setState(partialState: Partial<ICommentSynthesizerState>) {
    const nextState = { ...this.state, ...partialState };
    this.stateService.updateSpeechSynthesizerSettings(nextState);
  }

  @mutation()
  private SET_STATE(nextState: ICommentSynthesizerState): void {
    this.state = nextState;
  }

}
