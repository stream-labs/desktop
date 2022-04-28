import { authorizedHeaders, jfetch } from 'util/requests';
import { importSocketIOClient } from 'util/slow-imports';
import { Inject, Service } from './core';
import { UserService } from './user';
import uuid from 'uuid/v4';

export class GuestCamService extends Service {
  @Inject() userService: UserService;

  io: SocketIOClientStatic;
  socket: SocketIOClient.Socket;

  async start() {
    const roomUrl = 'https://stage6.streamlabs.com/api/v5/slobs/streamrooms/current';
    const roomResult = await jfetch(roomUrl, {
      headers: authorizedHeaders(this.userService.views.auth.apiToken),
    });

    console.log('Room result', roomResult);

    const ioConfigUrl = 'https://stage6.streamlabs.com/api/v5/slobs/streamrooms/io/config';
    const ioConfigResult = await jfetch<{ url: string; token: string }>(ioConfigUrl, {
      headers: authorizedHeaders(this.userService.views.auth.apiToken),
    });

    console.log('io Config Result', ioConfigResult);

    this.openSocketConnection(ioConfigResult.url, ioConfigResult.token);
  }

  async openSocketConnection(url: string, token: string) {
    // dynamically import socket.io because it takes to much time to import it on startup
    if (!this.io) {
      this.io = (await importSocketIOClient()).default;
    }

    if (this.socket) {
      this.socket.disconnect();
    }

    console.log('connecting to', url);

    this.socket = this.io(url, {
      transports: ['websocket'],
      reconnectionDelay: 5000,
      reconnectionDelayMax: 20000,
      timeout: 5000,
    });

    this.socket.on('connect', async () => {
      console.log('CONNECTION OPEN');

      const auth = await this.authenticateSocket(token);
      console.log(auth);

      // this.sendWebRTCRequest({
      //   type: 'createProducer',
      //   data: { streamId: uuid(), type: 'stream', name: 'Andy', tracks: 2 },
      // });
    });
    this.socket.on('connect_error', (e: any) => console.log('Connection Error', e));
    this.socket.on('connect_timeout', () => console.log('Connection Timeout'));
    this.socket.on('error', () => console.log('Error'));
    this.socket.on('disconnect', () => console.log('Connection Closed'));
  }

  async authenticateSocket(token: string) {
    return new Promise(r => {
      this.socket.emit('authenticate', { token, username: 'Andy' }, r);
    });
  }

  async sendWebRTCRequest(data: unknown) {
    this.socket.emit('webrtc', data, (response: unknown) => {
      console.log('Got WebRTC Response', response);
    });
  }
}
