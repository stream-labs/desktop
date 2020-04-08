import { Service } from 'services/core/service';
import { Inject } from 'services/core/injector';
import { UserService } from 'services/user';
import { HostsService } from 'services/hosts';
import { handleResponse, authorizedHeaders } from 'util/requests';
import { Subject } from 'rxjs';
import { importSocketIOClient } from 'util/slow-imports';
import { SceneCollectionsService } from 'services/scene-collections';
import { CommunityHubService } from './index';

type TSocketEvent = 'status_update';

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

  socketEvent = new Subject<TSocketEvent>();
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
        const url = json.path;
        this.socket = this.io(url, { transports: json.settings.transports });
        this.communityHubService.self = json.user;

        this.reconnectAttempts = json.settings.reconnect_attempts;
        window.setTimeout(() => (this.reconnectDelayReached = true), json.settings.reconnect_delay);

        // These are useful for debugging
        this.socket.on('connect', () => this.log('Connection Opened'));
        this.socket.on('connect_error', (e?: any) => this.reconnect('Connection Error', e));
        this.socket.on('connect_timeout', () => this.reconnect('Connection Timeout'));
        this.socket.on('error', () => this.log('Error'));
        this.socket.on('disconnect', () => this.log('Connection Closed'));

        this.socket.on('event', (e: any) => {
          this.log('event', e);
          this.socketEvent.next(e);
        });
      });
  }

  private log(message: string, ...args: any[]) {
    console.debug(`CHAT-WS: ${message}`, ...args);
  }
}
