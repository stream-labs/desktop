import { Inject } from 'services/core/injector';
import { NicoliveProgramService } from 'services/nicolive-program/nicolive-program';
import { StatefulService, mutation } from 'services/core/stateful-service';
import { Subscription, EMPTY, Observable, of, interval } from 'rxjs';
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
  isThreadMessage,
  IMessageServerClient,
  MessageResponse,
} from './MessageServerClient';
import { classify } from './ChatMessage/classifier';
import { isOperatorCommand } from './ChatMessage/util';
import { NicoliveCommentFilterService } from 'services/nicolive-program/nicolive-comment-filter';
import { NicoliveCommentSynthesizerService } from './nicolive-comment-synthesizer';
import { AddComponent } from './ChatMessage/ChatComponentType';
import { WrappedChat, WrappedChatWithComponent } from './WrappedChat';
import { NicoliveCommentLocalFilterService } from './nicolive-comment-local-filter';
import { CustomizationService } from 'services/customization';

function makeEmulatedChat(
  content: string,
  date: number = Math.floor(Date.now() / 1000),
): Pick<WrappedChat, 'type' | 'value'> {
  return {
    type: 'n-air-emulated' as const,
    value: {
      content,
      date,
    },
  };
}

// yarn dev 用: ダミーでコメントを5秒ごとに出し続ける
class DummyMessageServerClient implements IMessageServerClient {
  connect(): Observable<MessageResponse> {
    return interval(5000).pipe(
      map(res => ({
        chat: makeEmulatedChat(`${res}`).value,
      })),
    );
  }
  requestLatestMessages(): void {
    // do nothing
  }
}

interface INicoliveCommentViewerState {
  /** 表示対象のコメント */
  messages: WrappedChatWithComponent[];
  /**
   * 直前の更新で表示対象から押し出されたコメント
   * ローカルフィルターとスクロール位置維持のために実体を持っている
   */
  popoutMessages: WrappedChatWithComponent[];
  pinnedMessage: WrappedChatWithComponent | null;
  speakingSeqId: number | null;
}

export class NicoliveCommentViewerService extends StatefulService<INicoliveCommentViewerState> {
  private client: IMessageServerClient | null = null;

  @Inject() private nicoliveProgramService: NicoliveProgramService;
  @Inject() private nicoliveCommentFilterService: NicoliveCommentFilterService;
  @Inject() private nicoliveCommentLocalFilterService: NicoliveCommentLocalFilterService;
  @Inject() private nicoliveCommentSynthesizerService: NicoliveCommentSynthesizerService;
  @Inject() private customizationService: CustomizationService;

  static initialState: INicoliveCommentViewerState = {
    messages: [],
    popoutMessages: [],
    pinnedMessage: null,
    speakingSeqId: null,
  };

  get items() {
    return this.state.messages;
  }

  get speakingEnabled(): boolean {
    return this.nicoliveCommentSynthesizerService.enabled;
  }
  set speakingEnabled(e: boolean) {
    this.nicoliveCommentSynthesizerService.enabled = e;
  }
  get speakingSeqId() {
    return this.state.speakingSeqId;
  }

  get filterFn() {
    return (chat: WrappedChatWithComponent) =>
      chat.type !== 'invisible' && this.nicoliveCommentLocalFilterService.filterFn(chat);
  }
  get itemsLocalFiltered() {
    return this.items.filter(this.filterFn);
  }
  get recentPopoutsLocalFiltered() {
    return this.state.popoutMessages.filter(this.filterFn);
  }

  init() {
    super.init();
    this.nicoliveProgramService.stateChange
      .pipe(
        map(({ roomURL, roomThreadID }) => ({
          roomURL,
          roomThreadID,
        })),
        distinctUntilChanged(
          (prev, curr) => prev.roomURL === curr.roomURL && prev.roomThreadID === curr.roomThreadID,
        ),
      )
      .subscribe(state => this.onNextConfig(state));

    this.nicoliveCommentFilterService.stateChange.subscribe(() => {
      this.SET_STATE({
        messages: this.items.map(chat => this.nicoliveCommentFilterService.applyFilter(chat)),
      });
    });
  }

  lastSubscription: Subscription = null;
  private onNextConfig({ roomURL, roomThreadID }: MessageServerConfig): void {
    this.unsubscribe();
    this.clearList();
    this.pinComment(null);

    // 予約番組は30分前にならないとURLが来ない
    if (!roomURL || !roomThreadID) return;

    if (process.env.DEV_SERVER) {
      // yarn dev 時はダミーでコメントを5秒ごとに出し続ける
      this.client = new DummyMessageServerClient();
    } else {
      this.client = new MessageServerClient({ roomURL, roomThreadID });
    }
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
    this.lastSubscription = this.client
      .connect()
      .pipe(
        groupBy(msg => Object.keys(msg)[0]),
        mergeMap((group$): Observable<Pick<WrappedChat, 'type' | 'value'>> => {
          switch (group$.key) {
            case 'chat':
              return group$.pipe(
                filter(isChatMessage),
                map(({ chat }) => ({
                  type: classify(chat),
                  value: chat,
                })),
              );
            case 'thread':
              return group$.pipe(
                filter(isThreadMessage),
                filter(msg => (msg.thread.resultcode ?? 0) !== 0),
                mapTo(makeEmulatedChat('コメントの取得に失敗しました')),
              );
            case 'leave_thread':
              return group$.pipe(mapTo(makeEmulatedChat('コメントの取得に失敗しました')));
            default:
              EMPTY;
          }
        }),
        catchError(err => {
          console.error(err);
          return of(makeEmulatedChat(`エラーが発生しました: ${err.message}`));
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
      )
      .subscribe(values => this.onMessage(values.map(c => AddComponent(c))));
    this.client.requestLatestMessages();
  }

  private queueToSpeech(values: WrappedChatWithComponent[]) {
    if (!this.nicoliveCommentSynthesizerService.enabled) {
      return;
    }
    for (const chat of values) {
      const speech = this.nicoliveCommentSynthesizerService.makeSpeech(chat);
      if (speech) {
        this.nicoliveCommentSynthesizerService.speakText(
          speech,
          () => {
            this.SET_STATE({
              speakingSeqId: chat.seqId,
            });
          },
          () => {
            if (this.state.speakingSeqId === chat.seqId) {
              this.SET_STATE({
                speakingSeqId: null,
              });
            }
          },
        );
      }
    }
  }

  private onMessage(values: WrappedChatWithComponent[]) {
    const maxQueueToSpeak = 3; // 直近3件つづ読み上げ対象にする
    const recentSeconds = 60;

    const nowSeconds = Date.now() / 1000;
    this.queueToSpeech(
      values
        .filter(c => {
          if (!this.filterFn(c)) {
            return false;
          }
          if (!c.value || !c.value.date) {
            return false;
          }
          if (c.value.date < nowSeconds - recentSeconds) {
            return false;
          }
          return true;
        })
        .slice(-maxQueueToSpeak),
    );

    const maxRetain = 100; // 最新からこの件数を一覧に保持する
    const concatMessages = this.state.messages.concat(values);
    const popoutMessages = concatMessages.slice(0, -maxRetain);
    this.SET_STATE({
      messages: concatMessages.slice(-maxRetain),
      popoutMessages,
    });
    if (!this.customizationService.state.compactModeNewComment) {
      this.customizationService.setCompactModeNewComment(true);
    }
  }

  private clearList() {
    this.SET_STATE({ messages: [], popoutMessages: [] });
  }

  pinComment(pinnedMessage: WrappedChatWithComponent | null) {
    this.SET_STATE({ pinnedMessage });
  }

  @mutation()
  private SET_STATE(nextState: Partial<INicoliveCommentViewerState>) {
    this.state = { ...this.state, ...nextState };
  }
}
