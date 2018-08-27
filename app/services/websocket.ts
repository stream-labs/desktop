import { Service } from './service';
import { Inject } from 'util/injector';
import { UserService } from 'services/user';
import { HostsService } from 'services/hosts';
import { handleErrors, authorizedHeaders } from 'util/requests';
import io from 'socket.io-client';
import { Subject } from 'rxjs/Subject';

export type TSocketEvent =
  IStreamlabelsSocketEvent |
  IDonationSocketEvent |
  IFacemaskSocketEvent |
  IFollowSocketEvent |
  ISubscriptionSocketEvent;

interface IStreamlabelsSocketEvent {
  type: 'streamlabels';
  message: {
    data: Dictionary<string>;
  };
}

interface IDonationSocketEvent {
  type: 'donation';
  message: {
    name: string;
    amount: string;
  }[];
}

interface IFacemaskSocketEvent {
  type: 'facemask';
  message: {
    name: string;
    amount: string;
    facemask: string;
    message: string;
  }[];
}

interface IFollowSocketEvent {
  type: 'follow';
  message: {
    name: string;
  }[];
}

interface ISubscriptionSocketEvent {
  type: 'subscription';
  message: {
    name: string;
  }[];
}

export class WebsocketService extends Service {
  @Inject() userService: UserService;
  @Inject() hostsService: HostsService;

  socket: SocketIOClient.Socket;

  socketEvent = new Subject<TSocketEvent>();

  init() {
    this.openSocketConnection();

    this.userService.userLogin.subscribe(() => {
      this.openSocketConnection();
    });
  }

  openSocketConnection() {
    if (!this.userService.isLoggedIn()) {
      console.warn('User must be logged in to make a socket connection');
      return;
    }

    if (this.socket) {
      this.socket.disconnect();
    }

    const url = `https://${this.hostsService.streamlabs}/api/v5/slobs/socket-token`;
    const headers = authorizedHeaders(this.userService.apiToken);
    const request = new Request(url, { headers });

    fetch(request)
      .then(handleErrors)
      .then(response => response.json())
      .then(json => json.socket_token)
      .then(token => {
        const url = `${this.hostsService.io}?token=${token}`;
        this.socket = io(url, { transports: ['websocket'] });

        // These are useful for debugging
        this.socket.on('connect', () => this.log('Connection Opened'));
        this.socket.on('connect_error', (e: any) => this.log('Connection Error', e));
        this.socket.on('connect_timeout', () => this.log('Connection Timeout'));
        this.socket.on('error', () => this.log('Error'));
        this.socket.on('disconnect', () => this.log('Connection Closed'));

        this.socket.on('event', (e: any) => {
          this.socketEvent.next(e);
        });
      });
  }

  private log(message: string, ...args: any[]) {
    console.debug(`WS: ${message}`, ...args);
  }
}
