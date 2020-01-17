import { Inject } from 'util/injector';
import { NicoliveProgramService } from './nicolive-program';
import { map, distinctUntilChanged, bufferTime, filter } from 'rxjs/operators';
import { StatefulService, mutation } from 'services/stateful-service';
import { MessageServerClient, MessageServerConfig, isChatMessage, ChatMessage } from './MessageServerClient';
import { Subscription } from 'rxjs';

interface INicoliveCommentViewerState {
  messages: ChatMessage[];
}

export class NicoliveCommentViewerService extends StatefulService<INicoliveCommentViewerState> {
  private client: MessageServerClient | null = null;
  @Inject() private nicoliveProgramService: NicoliveProgramService;

  static initialState: INicoliveCommentViewerState = {
    messages: [],
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
      this.onMessage(values.filter(isChatMessage));
    })
    this.client.requestLatestMessages();
  }

  private onMessage(values: ChatMessage[]) {
    this.SET_STATE({ messages: this.state.messages.concat(values).slice(-200) })
  }

  private clearState() {
    this.SET_STATE({ messages: [] });
  }

  @mutation()
  private SET_STATE(nextState: INicoliveCommentViewerState) {
    this.state = nextState;
  }

}
