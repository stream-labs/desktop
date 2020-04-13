import { Inject } from 'util/injector';
import { NicoliveProgramService } from 'services/nicolive-program/nicolive-program';
import { StatefulService, mutation } from 'services/stateful-service';
import { Subscription, EMPTY, Observable, of } from 'rxjs';
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
import {
  MessageServerClient,
  MessageServerConfig,
  isChatMessage,
  ChatMessage,
  isThreadMessage,
} from './MessageServerClient';
import { ChatMessageType, classify } from './ChatMessage/classifier';
import { isOperatorCommand } from './ChatMessage/util';
import { NicoliveCommentFilterService } from 'services/nicolive-program/nicolive-comment-filter';

export type WrappedChat = {
  type: ChatMessageType;
  value: ChatMessage;
  seqId: number;
  /** NG追加したときに手元でフィルタをかけた結果 */
  filtered?: boolean;
};

function makeEmulatedChat(
  content: string,
  date: number = Math.floor(Date.now() / 1000)
): Pick<WrappedChat, 'type' | 'value'> {
  return {
    type: 'n-air-emulated' as const,
    value: {
      content,
      date,
    },
  }
}

interface INicoliveCommentViewerState {
  /** 表示対象のコメント */
  messages: WrappedChat[];
  /**
   * 直前の更新で表示対象から押し出されたコメント
   * ローカルフィルターとスクロール位置維持のために実体を持っている
   */
  popoutMessages: WrappedChat[];
  pinnedMessage: WrappedChat | null;
}

export class NicoliveCommentViewerService extends StatefulService<INicoliveCommentViewerState> {
  private client: MessageServerClient | null = null;
  @Inject() private nicoliveProgramService: NicoliveProgramService;
  @Inject() private nicoliveCommentFilterService: NicoliveCommentFilterService;

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
    super.init();
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

    this.nicoliveCommentFilterService.stateChange.subscribe(() => {
      this.SET_STATE({
        messages: this.items.map(chat => this.nicoliveCommentFilterService.applyFilter(chat))
      });
    })
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
                  mapTo(makeEmulatedChat('コメントの取得に失敗しました'))
                );
            case 'leave_thread':
              return group$
                .pipe(
                  mapTo(makeEmulatedChat('コメントの取得に失敗しました'))
                );
            default: EMPTY;
          }
        }),
        catchError(err => {
          console.error(err);
          return of(makeEmulatedChat(`エラーが発生しました: ${err.message}`))
        }),
        endWith(makeEmulatedChat('サーバーとの接続が終了しました')),
        tap(v => {
          if (isOperatorCommand(v.value) && v.value.content === '/disconnect') {
            // completeが発生しないのでサーバーとの接続終了メッセージは出ない
            // `/disconnect` の代わりのメッセージは出さない仕様なので問題ない
            this.unsubscribe();
          }
        }),
        map(({ type, value }, seqId) => ({ type, value, seqId })),
        bufferTime(1000),
        filter(arr => arr.length > 0),
      ).subscribe(values => this.onMessage(values as any));
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
