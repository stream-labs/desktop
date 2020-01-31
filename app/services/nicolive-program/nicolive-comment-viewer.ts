import { Inject } from 'util/injector';
import { NicoliveProgramService } from './nicolive-program';
import { map, distinctUntilChanged, bufferTime, filter } from 'rxjs/operators';
import { StatefulService, mutation } from 'services/stateful-service';
import { MessageServerClient, MessageServerConfig, isChatMessage, ChatMessage } from './MessageServerClient';
import { Subscription } from 'rxjs';
import { ChatMessageType, classify } from './ChatMessage/classifier';

export type WrappedChat = {
  type: ChatMessageType;
  value: ChatMessage;
};

interface INicoliveCommentViewerState {
  messages: WrappedChat[];
  popoutMessages: number;
  arrivalMessages: number;
}

export class NicoliveCommentViewerService extends StatefulService<INicoliveCommentViewerState> {
  private client: MessageServerClient | null = null;
  @Inject() private nicoliveProgramService: NicoliveProgramService;

  static initialState: INicoliveCommentViewerState = {
    messages: [],
    popoutMessages: 0,
    arrivalMessages: 0,
  };

  get items() {
    return this.state.messages;
  }

  init() {
    this.nicoliveProgramService.stateChange
      .pipe(
        map(({
          roomURL,
          roomThreadID,
        }) => ({
          roomURL,
          roomThreadID,
        })),
        distinctUntilChanged((prev, curr) => (
          prev.roomURL === curr.roomURL
          && prev.roomThreadID === curr.roomThreadID
        ))
      ).subscribe(state => this.onNextConfig(state));
  }

  lastSubscription: Subscription = null;
  private onNextConfig({
    roomURL,
    roomThreadID,
  }: MessageServerConfig): void {
    this.lastSubscription?.unsubscribe();
    this.clearState();
    this.client = new MessageServerClient({ roomURL, roomThreadID });
    this.lastSubscription = this.client.connect().pipe(
      bufferTime(1000),
      filter(arr => arr.length > 0)
    ).subscribe(values => {
      this.onMessage(values.filter(isChatMessage).map(x => ({
        type: classify(x.chat),
        value: x.chat,
      })));
  })
    this.client.requestLatestMessages();
  }

  private onMessage(values: WrappedChat[]) {
    const arrivalLength = values.length;
    const concatMessages = this.state.messages.concat(values);
    const concatLength = concatMessages.length;
    this.SET_STATE({
      messages: concatMessages,
      popoutMessages: Math.max(concatLength - 200, 0),
      arrivalMessages: arrivalLength,
    });
  }

  private clearState() {
    this.SET_STATE({ messages: [], popoutMessages: 0, arrivalMessages: 0 });
  }

  @mutation()
  private SET_STATE(nextState: INicoliveCommentViewerState) {
    this.state = nextState;
  }

}
