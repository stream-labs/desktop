import electronLog from 'electron-log';
import { Service } from './core/service';
import { Inject } from 'services/core/injector';
import { UserService } from 'services/user';
import { HostsService } from 'services/hosts';
import { handleResponse, authorizedHeaders } from 'util/requests';
import io from 'socket.io-client';
import { Subject } from 'rxjs';
import { AppService } from 'services/app';
import { IRecentEvent } from 'services/recent-events';

export type TSocketEvent =
  | IStreamlabelsSocketEvent
  | IAlertPlayingSocketEvent
  | IAlertProfileChanged
  | IEventSocketEvent
  | IFmExtEnabledSocketEvent;

interface IStreamlabelsSocketEvent {
  type: 'streamlabels';
  message: {
    data: Dictionary<string>;
  };
}

export interface IEventSocketEvent {
  type:
    | 'merch'
    | 'donation'
    | 'facemaskdonation'
    | 'follow'
    | 'subscription'
    | 'bits'
    | 'host'
    | 'raid'
    | 'sticker'
    | 'effect'
    | 'like'
    | 'stars'
    | 'support'
    | 'share'
    | 'superchat'
    | 'pledge'
    | 'eldonation'
    | 'tiltifydonation'
    | 'donordrivedonation'
    | 'justgivingdonation'
    | 'treat';
  message: IRecentEvent[];
}

interface IFmExtEnabledSocketEvent {
  type: 'fm-ext-enabled';
}

export interface IAlertPlayingSocketEvent {
  type: 'alertPlaying';
  message: {
    facemask?: string;
    type: string;
    amount?: string;
  };
}

interface IAlertProfileChanged {
  type: 'alertProfileChanged';
}

export class WebsocketService extends Service {
  @Inject() private userService: UserService;
  @Inject() private hostsService: HostsService;
  @Inject() private appService: AppService;

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
      .then(handleResponse)
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
          this.log('event', e);
          this.socketEvent.next(e);
        });
      });
  }

  private log(message: string, ...args: any[]) {
    console.debug(`WS: ${message}`, ...args);

    if (this.appService.state.argv.includes('--network-logging')) {
      electronLog.log(`WS: ${message}`);
    }
  }
}
