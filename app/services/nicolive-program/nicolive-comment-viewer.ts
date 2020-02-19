import { Inject } from 'util/injector';
import { NicoliveProgramService } from './nicolive-program';
import {
  map,
  distinctUntilChanged,
  bufferTime,
  filter,
  catchError,
  mergeMap,
  groupBy,
  mapTo,
  endWith,
  tap,
} from 'rxjs/operators';
import { StatefulService, mutation } from 'services/stateful-service';
import {
  MessageServerClient,
  MessageServerConfig,
  isChatMessage,
  ChatMessage,
  isThreadMessage,
} from './MessageServerClient';
import { Subscription, EMPTY, Observable, of } from 'rxjs';
import { ChatMessageType, classify } from './ChatMessage/classifier';

export type WrappedChat = {
  type: ChatMessageType;
  value: ChatMessage;
  seqId: number;
};

interface INicoliveCommentViewerState {
  messages: WrappedChat[];
  popoutMessages: WrappedChat[];
  pinnedMessage: WrappedChat | null;
}

export class NicoliveCommentViewerService extends StatefulService<INicoliveCommentViewerState> {
  private client: MessageServerClient | null = null;
  @Inject() private nicoliveProgramService: NicoliveProgramService;

  static initialState: INicoliveCommentViewerState = {
    messages: [],
    popoutMessages: [],
    pinnedMessage: null,
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
    this.unsubscribe();
    this.clearList();
    this.pinComment(null);

    // 予約番組は30分前にならないとURLが来ない
    if (!roomURL || !roomThreadID) return;

    this.client = new MessageServerClient({ roomURL, roomThreadID });
    this.connect();
  }

  refreshConnection() {
    this.unsubscribe();
    this.clearList();
    // 再接続ではピン止めは解除しない

    this.connect();
  }

  private unsubscribe() {
    this.lastSubscription?.unsubscribe();
  }

  private connect() {
    this.lastSubscription = this.client.connect()
      .pipe(
        groupBy(msg => Object.keys(msg)[0]),
        mergeMap((group$): Observable<Pick<WrappedChat, 'type' | 'value'>> => {
          switch (group$.key) {
            case 'chat':
              return group$
                .pipe(
                  filter(isChatMessage),
                  map(({ chat }) => ({
                    type: classify(chat),
                    value: chat,
                  })),
                );
            case 'thread':
              return group$
                .pipe(
                  filter(isThreadMessage),
                  filter(msg => (msg.thread.resultcode ?? 0) !== 0),
                  mapTo({
                    type: 'n-air-emulated',
                    value: {
                      content: 'スレッドへの参加に失敗しました',
                    },
                  })
                );
            case 'leave_thread':
              return group$
                .pipe(
                  mapTo({
                    type: 'n-air-emulated',
                    value: {
                      content: 'スレッドから追い出されました',
                    },
                  })
                );
            default: EMPTY;
          }
        }),
        catchError(err => of({
          type: 'n-air-emulated' as const,
          value: {
            content: `エラーが発生しました: ${err.message}`,
          },
        })),
        endWith({
          type: 'n-air-emulated' as const,
          value: {
            content: 'サーバーとの接続が終了しました',
          },
        }),
        tap(v => v.value.content === '/disconnect' && setTimeout(() => this.unsubscribe(), 1000)),
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

  private clearList() {
    this.SET_STATE({ messages: [], popoutMessages: [] });
  }

  pinComment(pinnedMessage: WrappedChat | null) {
    this.SET_STATE({ pinnedMessage });
  }

  @mutation()
  private SET_STATE(nextState: Partial<INicoliveCommentViewerState>) {
    this.state = { ...this.state, ...nextState };
  }

}
