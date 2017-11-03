import { Service } from 'services/service';
import { UserService } from 'services/user';
import { Inject } from 'util/injector';
import { HostsService } from 'services/hosts';
import { handleErrors } from 'util/requests';
import io from 'socket.io-client';

export class StreamlabelsService extends Service {

  @Inject() userService: UserService;
  @Inject() hostsService: HostsService;


  init() {
    this.fetchSocketToken().then(token => {
      const url = `https://aws-io.${this.hostsService.streamlabs}?token=${token}`;

      console.log('Connecting with token: ', token);
      console.log('Connecting to url:', url);

      const socket = io(url, { transports: ['websocket'] });

      socket.on('connect', () => {
        console.log('Connection Opened');
      });

      socket.on('connect_error', (e: any) => {
        console.log('Connection Error', e);
      });

      socket.on('connect_timeout', () => {
        console.log('Connection Timeout');
      });

      socket.on('error', () => {
        console.log('Error');
      });


      socket.on('disconnect', () => {
        console.log('Connection Closed');
      });

      socket.on('event', (e: any) => {
        console.log('Message Received', e);
      });
    });
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

}
