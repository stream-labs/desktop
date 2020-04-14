import { Service } from 'services/core/service';
import { Inject } from 'services/core/injector';
import { UserService } from 'services/user';
import { HostsService } from 'services/hosts';
import { handleResponse, authorizedHeaders } from 'util/requests';
import { Subject } from 'rxjs';
import { importSocketIOClient } from 'util/slow-imports';
import { SceneCollectionsService } from 'services/scene-collections';
import { CommunityHubService, IFriend, IChatRoom } from './index';

interface IChatMessageEvent {
  data: {
    room: string;
    merssage: string;
  };
  user: IFriend;
}

interface IInternalEvent {
  action: 'status_update';
  data: {
    user: {
      id: number;
      avatar: string;
      name: string;
      is_prime: boolean;
    };
    status: string;
  };
}

interface IRoomUpdate {
  action: 'new_member';
  room: IChatRoom;
}

interface IBearerAuth {
  path: string;
  settings: {
    reconnect_delay_max: number;
    reconnect_delay: number;
    reconnect_attempts: number;
    timeout: number;
    transports: Array<string>;
  };
  user: {
    id: number;
    name: string;
    avatar: string;
    is_prime: boolean;
  };
}

export class ChatWebsocketService extends Service {
  @Inject() private userService: UserService;
  @Inject() private hostsService: HostsService;
  @Inject() private sceneCollectionsService: SceneCollectionsService;
  @Inject() private communityHubService: CommunityHubService;

  private socket: SocketIOClient.Socket;
  private io: SocketIOClientStatic;

  roomUpdateEvent = new Subject<IRoomUpdate>();
  chatMessageEvent = new Subject<IChatMessageEvent>();
  internalEvent = new Subject<IInternalEvent>();

  init() {
    this.sceneCollectionsService.collectionInitialized.subscribe(() => {
      this.openSocketConnection();
    });
  }

  reconnectDelayReached = false;
  reconnectAttempts = 10;

  get canReconnect() {
    return this.reconnectAttempts > 0 && this.reconnectDelayReached === true;
  }

  connect() {
    this.log('Connection Opened');

    this.socket.emit('join_rooms', this.communityHubService.views.roomsToJoin);
  }

  reconnect(type: string, e?: any) {
    this.log(type, e);
    if (this.canReconnect) {
      this.openSocketConnection();
    }
  }

  sendMessage(message: { room: string; message: string }) {
    this.socket.emit('chat_message', message);
  }

  sendStatusUpdate(status: string, game?: string, room?: string) {
    this.socket.emit('internal_event', { action: 'status_update', status, game, room });
  }

  async openSocketConnection() {
    if (!this.userService.isLoggedIn) {
      console.warn('User must be logged in to make a socket connection');
      return;
    }

    // dynamically import socket.io because it takes to much time to import it on startup
    if (!this.io) {
      this.io = (await importSocketIOClient()).default;
    }

    if (this.socket) {
      this.socket.disconnect();
    }

    const url = `https://${this.hostsService.streamlabs}/api/v5/slobs-chat/io/info`;
    const headers = authorizedHeaders(this.userService.apiToken);
    const request = new Request(url, { headers });

    fetch(request)
      .then(handleResponse)
      .then((json: IBearerAuth) => {
        this.socket = this.io(json.path, { transports: json.settings.transports });
        this.communityHubService.self = json.user;

        this.reconnectAttempts = json.settings.reconnect_attempts;
        window.setTimeout(() => (this.reconnectDelayReached = true), json.settings.reconnect_delay);

        // These are useful for debugging
        this.socket.on('connect', () => this.connect());
        this.socket.on('connect_error', (e?: any) => this.reconnect('Connection Error', e));
        this.socket.on('connect_timeout', () => this.reconnect('Connection Timeout'));
        this.socket.on('error', () => this.log('Error'));
        this.socket.on('disconnect', () => this.log('Connection Closed'));

        this.listenForEvents();
      });
  }

  listenForEvents() {
    if (!this.socket) return;
    this.socket.on('room_update', (e: any) => {
      this.log('room_update', e);
      this.roomUpdateEvent.next(e);
    });
    this.socket.on('chat_message', (e: any) => {
      this.log('chat_message', e);
      this.chatMessageEvent.next(e);
    });
    this.socket.on('internal_event', (e: any) => {
      this.log('internal_event', e);
      this.internalEvent.next(e);
    });
  }

  private log(message: string, ...args: any[]) {
    console.debug(`CHAT-WS: ${message}`, ...args);
  }
}
