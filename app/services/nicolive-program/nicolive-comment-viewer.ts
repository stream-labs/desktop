import { Inject } from 'util/injector';
import { NicoliveProgramService } from './nicolive-program';
import { map, distinctUntilChanged } from 'rxjs/operators';
import { StatefulService, mutation } from 'services/stateful-service';
import { Message, MessageServerClient, MessageServerConfig, isChatMessage, ChatMessage } from './MessageServerClient';

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

  private onNextConfig({
    roomURL,
    roomThreadID,
  }: MessageServerConfig): void {
    if (this.client) this.client.disconnect();
    this.clearState();
    this.client = new MessageServerClient({ roomURL, roomThreadID });
    this.client.onMessage(value => {
      if (isChatMessage(value)) {
        this.onMessage(value);
      }
    });
    this.client.connect();
    this.client.requestLatestMessages();
  }

  private onMessage(value: ChatMessage) {
    this.SET_STATE({ messages: this.state.messages.concat(value).slice(-200) })
  }

  private clearState() {
    this.SET_STATE({ messages: [] });
  }

  @mutation()
  private SET_STATE(nextState: INicoliveCommentViewerState) {
    this.state = nextState;
  }

}
