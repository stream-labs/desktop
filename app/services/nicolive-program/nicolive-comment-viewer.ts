import { Inject } from 'util/injector';
import { NicoliveProgramService } from './nicolive-program';
import { map, distinctUntilChanged, bufferTime, filter, finalize, merge, tap } from 'rxjs/operators';
import { StatefulService, mutation } from 'services/stateful-service';
import {
  MessageServerClient,
  MessageServerConfig,
  isChatMessage,
  ChatMessage,
  MessageResponse,
  isThreadMessage,
  isLeaveThreadMessage,
} from './MessageServerClient';
import { Subscription, Subject } from 'rxjs';
import { ChatMessageType, classify } from './ChatMessage/classifier';

export type WrappedChat = {
  type: ChatMessageType;
  value: ChatMessage;
  seqId: number;
};

interface INicoliveCommentViewerState {
  messages: WrappedChat[];
  popoutMessages: WrappedChat[];
}

export class NicoliveCommentViewerService extends StatefulService<INicoliveCommentViewerState> {
  private client: MessageServerClient | null = null;
  @Inject() private nicoliveProgramService: NicoliveProgramService;

  private backdoorSubject: Subject<Omit<WrappedChat, 'seqId'>> = new Subject();

  static initialState: INicoliveCommentViewerState = {
    messages: [],
    popoutMessages: [],
  };

  get items() {
    return this.state.messages;
  }

  get recentPopouts() {
    return this.state.popoutMessages;
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
    this.reset();
    this.client = new MessageServerClient({ roomURL, roomThreadID });
    this.connect();
  }

  refreshConnection() {
    this.reset();
    this.connect();
  }

  private reset() {
    this.unsubscribe();
    this.clearState();
  }

  private unsubscribe() {
    this.lastSubscription?.unsubscribe();
  }

  private connect() {
    this.lastSubscription = this.client.connect()
      .pipe(
        finalize(() => {
          // FIXME: 動かない（流せてもコンポーネントに反映できない）
          this.backdoorSubject.next({
            type: 'n-air-emulated',
            value: {
              content: 'コメントサーバーから切断されました',
            },
          });
        }),
        tap(msg => {
          if (isThreadMessage(msg) && (msg.thread.resultcode ?? 0 === 0)) {
            this.backdoorSubject.next({
              type: 'n-air-emulated',
              value: {
                content: 'スレッドへの参加に失敗しました',
              },
            });
            setTimeout(() => this.unsubscribe(), 3000);
          } else if (isLeaveThreadMessage(msg)) {
            this.backdoorSubject.next({
              type: 'n-air-emulated',
              value: {
                content: 'スレッドから追い出されました',
              },
            });
            setTimeout(() => this.unsubscribe(), 3000);
          } else if (isChatMessage(msg) && (msg.chat.content === '/disconnect')) {
            setTimeout(() => this.unsubscribe(), 3000);
          }
        }),
        filter(isChatMessage),
        map(({ chat }) => ({
          type: classify(chat),
          value: chat,
        })),
        merge(this.backdoorSubject.asObservable()),
        map(({ type, value }, seqId) => ({ type, value, seqId })),
        bufferTime(1000),
        filter(arr => arr.length > 0),
      ).subscribe(values => this.onMessage(values));
    this.client.requestLatestMessages();
  }

  private onMessage(values: WrappedChat[]) {
    const concatMessages = this.state.messages.concat(values);
    const popoutMessages = concatMessages.slice(100);
    this.SET_STATE({
      messages: concatMessages.slice(-100),
      popoutMessages,
    });
  }

  private clearState() {
    this.SET_STATE({ messages: [], popoutMessages: [] });
  }

  @mutation()
  private SET_STATE(nextState: INicoliveCommentViewerState) {
    this.state = nextState;
  }

}
