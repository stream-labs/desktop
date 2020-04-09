import { Service } from 'services/core/service';
import { Inject } from 'services/core/injector';
import { UserService } from 'services/user';
import { HostsService } from 'services/hosts';
import { handleResponse, authorizedHeaders } from 'util/requests';
import { Subject } from 'rxjs';
import { importSocketIOClient } from 'util/slow-imports';
import { SceneCollectionsService } from 'services/scene-collections';
import { CommunityHubService } from './index';

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

  socket: SocketIOClient.Socket;

  statusUpdateEvent = new Subject<'status_update'>();
  roomUpdateEvent = new Subject<'room_update'>();
  chatMessageEvent = new Subject<'chat_message'>();
  internalEvent = new Subject<'internal_event'>();
  io: SocketIOClientStatic;

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
    this.socket.on('status_update', (e: any) => {
      this.log('status_update', e);
      this.statusUpdateEvent.next(e);
    });
    this.socket.on('room_update', (e: any) => {
      this.log('room_update', e);
      this.statusUpdateEvent.next(e);
    });
    this.socket.on('chat_message', (e: any) => {
      this.log('chat_message', e);
      this.statusUpdateEvent.next(e);
    });
    this.socket.on('internal_event', (e: any) => {
      this.log('internal_event', e);
      this.statusUpdateEvent.next(e);
    });
  }

  private log(message: string, ...args: any[]) {
    console.debug(`CHAT-WS: ${message}`, ...args);
  }
}
