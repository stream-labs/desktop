import { Service } from 'services/service';
import { UserService } from 'services/user';
import { Inject } from 'util/injector';
import { HostsService } from 'services/hosts';
import { handleErrors } from 'util/requests';
import io from 'socket.io-client';


export interface IStreamlabelsData {
  [label: string]: string;
}


export class StreamlabelsService extends Service {

  @Inject() userService: UserService;
  @Inject() hostsService: HostsService;


  data: IStreamlabelsData;


  init() {
    this.fetchSocketToken().then(token => {
      const url = `https://aws-io.${this.hostsService.streamlabs}?token=${token}`;

      console.log('Connecting with token: ', token);
      console.log('Connecting to url:', url);

      const socket = io(url, { transports: ['websocket'] });

      // These are useful for debugging
      socket.on('connect', this.log('Connection Opened'));
      socket.on('connect_error', (e: any) => this.log('Connection Error', e));
      socket.on('connect_timeout', () => this.log('Connection Timeout'));
      socket.on('error', () => this.log('Error'));
      socket.on('disconnect', () => this.log('Connection Closed'));

      socket.on('event', (e: any) => {
        console.log('Message Received', e);
      });
    });
  }


  log(message: string, ...args: any[]) {
    console.log(`Streamlabels: ${message}`, ...args);
  }


  /**
   * Attempt to load init
   */
  fetchInitialData() {
    // TODO: Implement
  }


  fetchSocketToken(): Promise<string> {
    if (!this.userService.isLoggedIn()) return Promise.reject('User must be logged in');

    const url = `https://${this.hostsService.streamlabs}/api/v5/slobs/socket-token/${this.userService.widgetToken}`;
    const request = new Request(url);

    return fetch(request)
      .then(handleErrors)
      .then(response => response.json())
      .then(json => json.socket_token);
  }


  setStreamlabelsData(data: IStreamlabelsData) {
    // TODO: Write data files based on current subscriptions

    this.data = data;
  }

}
