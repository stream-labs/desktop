import { authorizedHeaders, jfetch } from 'util/requests';
import { importSocketIOClient } from 'util/slow-imports';
import { Inject, Service } from './core';
import { UserService } from './user';
import uuid from 'uuid/v4';
import { SourcesService } from 'services/sources';
import { ScenesService } from './scenes';

interface IRoomResponse {
  room: string;
}

interface IIoConfigResponse {
  url: string;
  token: string;
}

export class GuestCamService extends Service {
  @Inject() userService: UserService;
  @Inject() sourcesService: SourcesService;
  @Inject() scenesService: ScenesService;

  io: SocketIOClientStatic;
  socket: SocketIOClient.Socket;
  room: string;

  async start() {
    // Ensure we have a Guest Cam source
    this.ensureSource();

    const roomUrl = 'https://stage6.streamlabs.com/api/v5/slobs/streamrooms/current';
    const roomResult = await jfetch<IRoomResponse>(roomUrl, {
      headers: authorizedHeaders(this.userService.views.auth.apiToken),
    });

    this.log('Room result', roomResult);

    this.room = roomResult.room;

    const ioConfigUrl = 'https://stage6.streamlabs.com/api/v5/slobs/streamrooms/io/config';
    const ioConfigResult = await jfetch<IIoConfigResponse>(ioConfigUrl, {
      headers: authorizedHeaders(this.userService.views.auth.apiToken),
    });

    this.log('io Config Result', ioConfigResult);

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

    this.socket = this.io(url, {
      transports: ['websocket'],
      reconnectionDelay: 5000,
      reconnectionDelayMax: 20000,
      timeout: 5000,
    });

    this.socket.on('connect', async () => {
      this.log('Socket Connected');

      const auth = await this.authenticateSocket(token);
      this.log('Socket Authenticated', auth);

      this.getSource().updateSettings({
        room: this.room,
        routerRtpCapabilities: JSON.stringify(auth.rtpCapabilities),
      });

      this.bustSettingsCache();

      console.log(this.getSource().getObsInput().settings);


      // this.createProducer();
    });
    this.socket.on('connect_error', (e: any) => console.log('Connection Error', e));
    this.socket.on('connect_timeout', () => console.log('Connection Timeout'));
    this.socket.on('error', () => console.log('Error'));
    this.socket.on('disconnect', () => console.log('Connection Closed'));
  }

  async createProducer() {
    const result = await this.sendWebRTCRequest({
      type: 'createProducer',
      data: { streamId: uuid(), type: 'stream', name: 'Andy', tracks: 2 },
    });
    this.log('Producer Created', result);

    this.getSource().updateSettings({ send_transport_response: result });
    this.getSource().updateSettings({ create_audio_producer: true });
    this.bustSettingsCache();
  }

  async authenticateSocket(token: string): Promise<{ success: boolean; rtpCapabilities: unknown }> {
    return new Promise(r => {
      this.socket.emit('authenticate', { token, username: 'Andy' }, r);
    });
  }

  // TODO: No longer needed after Steven's changes
  private bustSettingsCache() {
    this.getSource().updateSettings({ force_cache_bust: true });
  }

  sendWebRTCRequest(data: unknown) {
    return new Promise(resolve => {
      this.socket.emit('webrtc', data, resolve);
    });
  }

  ensureSource() {
    if (!this.getSourceId()) {
      this.scenesService.views.activeScene.createAndAddSource('Guest Cam', 'mediasoupconnector');
    }
  }

  getSourceId() {
    return this.sourcesService.views.getSourcesByType('mediasoupconnector')[0]?.sourceId;
  }

  getSource() {
    return this.sourcesService.views.getSource(this.getSourceId());
  }

  private log(...msgs: unknown[]) {
    console.log('[Guest Cam]', ...msgs);
  }
}
