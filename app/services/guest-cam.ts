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

/**
 * Interface describing the various functions and expected return values
 * we can make to the plugin using `callHandler`
 */
interface IObsReturnTypes {
  func_send_transport_response: {};
  func_routerRtpCapabilities: {};
  func_create_audio_producer: {
    connect_params: unknown;
  };
  func_create_video_producer: {
    produce_params: {
      rtpParameters: unknown;
      kind: string;
      transportId: string;
    };
  };
  func_connect_result: {
    produce_params: {
      rtpParameters: unknown;
      kind: string;
      transportId: string;
    };
  };
  func_produce_result: {};
  func_receive_transport_response: {};
  func_video_consumer_response: {
    connect_params: unknown;
  };
  func_audio_consumer_response: {
    connect_params: unknown;
  };
}

type TWebRTCSocketEvent = IProducerCreatedEvent | IConsumerCreatedEvent | IConsumerTrackEvent;

interface IProducerCreatedEvent {
  type: 'producerCreated';
  data: {
    audioId: string;
    name: string;
    socketId: string;
    streamId: string;
    type: string;
    videoId: string;
  };
}

interface IConsumerCreatedEvent {
  type: 'consumerCreated';
  data: {
    dtlsParameters: unknown;
    iceCandidates: unknown;
    iceParameters: unknown;
    id: string;
    socketId: string;
    streamId: string;
  };
}

interface IConsumerTrackEvent {
  type: 'consumerTrack';
  data: {
    kind: 'audio' | 'video';
  };
}

interface ISocketAuthResponse {
  success: boolean;
  rtpCapabilities: unknown;
}

/**
 * Represents a guest that we can consume audio/video from
 */
interface IConsumableStream {
  streamId: string;
  socketId: string;
  audioId: string;
  videoId: string;
  transportConnected: boolean;
}

interface ITurnConfig {
  expires_at: number;
  credential: string;
  urls: string[];
  username: string;
}

export class GuestCamService extends Service {
  @Inject() userService: UserService;
  @Inject() sourcesService: SourcesService;
  @Inject() scenesService: ScenesService;

  io: SocketIOClientStatic;
  socket: SocketIOClient.Socket;
  room: string;
  auth: ISocketAuthResponse;

  // TODO: We only support one guest for now
  guestStream: IConsumableStream;

  turnConfig: ITurnConfig;

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

  async getTurnConfig() {
    if (this.turnConfig && this.turnConfig.expires_at > Date.now()) {
      return this.turnConfig;
    }

    const turnConfigUrl = 'https://stage6.streamlabs.com/api/v5/slobs/streamrooms/turn/config';
    const turnConfigResult = await jfetch<ITurnConfig>(turnConfigUrl, {
      headers: authorizedHeaders(this.userService.views.auth.apiToken),
    });

    this.log('Fetched new TURN config', turnConfigResult);

    return turnConfigResult;
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

      this.auth = await this.authenticateSocket(token);
      this.log('Socket Authenticated', this.auth);

      this.getSource().updateSettings({
        room: this.room,
      });

      this.makeObsRequest('func_routerRtpCapabilities', this.auth.rtpCapabilities);

      this.createProducer();
    });
    this.socket.on('connect_error', (e: any) => this.log('Connection Error', e));
    this.socket.on('connect_timeout', () => this.log('Connection Timeout'));
    this.socket.on('error', () => this.log('Socket Error'));
    this.socket.on('disconnect', () => this.log('Connection Closed'));
    this.socket.on('webrtc', (e: TWebRTCSocketEvent) => this.onWebRTC(e));
  }

  onWebRTC(event: TWebRTCSocketEvent) {
    this.log('WebRTC Event', event);

    if (event.type === 'producerCreated') {
      this.createConsumer(event);
    } else if (event.type === 'consumerCreated') {
      this.onConsumerCreated(event);
    } else if (event.type === 'consumerTrack') {
      this.onConsumerTrack(event);
    }
  }

  async createProducer() {
    const source = this.getSource();
    const input = source.getObsInput();
    const streamId = uuid();
    const result = await this.sendWebRTCRequest({
      type: 'createProducer',
      data: { streamId, type: 'stream', name: 'Andy', tracks: 2 },
    });
    this.log('Producer Created', result);

    const turnConfig = await this.getTurnConfig();

    result['iceServers'] = [turnConfig];

    input.callHandler('func_send_transport_response', JSON.stringify(result));

    const connectParams = this.makeObsRequest('func_create_audio_producer', '').connect_params;

    this.log('Got Connect Params', connectParams);

    await this.sendWebRTCRequest({
      type: 'connectSendTransport',
      data: connectParams,
    });

    this.log('Connected Send Transport');

    // Always true - it's unclear what failure looks like from server
    const audioProduceParams = this.makeObsRequest('func_connect_result', 'true').produce_params;

    this.log('Got Audio Produce Params', audioProduceParams);

    const audioProduceResult = await this.sendWebRTCRequest({
      type: 'addProducerTrack',
      data: {
        streamId,
        producerTransportId: audioProduceParams.transportId,
        kind: audioProduceParams.kind,
        rtpParameters: audioProduceParams.rtpParameters,
      },
    });

    // Always true - it's unclear what failure looks like from server
    this.makeObsRequest('func_produce_result', 'true');

    this.log('Got Server Add Audio Track Result', audioProduceResult);

    const videoProduceParams = this.makeObsRequest('func_create_video_producer', 'true')
      .produce_params;

    this.log('Got Video Produce Params', videoProduceParams);

    const videoProduceResult = await this.sendWebRTCRequest({
      type: 'addProducerTrack',
      data: {
        streamId,
        producerTransportId: videoProduceParams.transportId,
        kind: videoProduceParams.kind,
        rtpParameters: videoProduceParams.rtpParameters,
      },
    });

    // Always true - it's unclear what failure looks like from server
    this.makeObsRequest('func_produce_result', 'true');

    this.log('Got Server Add Video Track Result', videoProduceResult);
  }

  async createConsumer(event: IProducerCreatedEvent) {
    this.log('Creating Consumer', event);

    // TODO - Don't consume our own producer

    // We need to store these for later so we can subscribe to the tracks
    this.guestStream = {
      streamId: event.data.streamId,
      socketId: event.data.socketId,
      audioId: event.data.audioId,
      videoId: event.data.videoId,
      transportConnected: false,
    };

    this.sendWebRTCRequest({
      type: 'createConsumer',
      data: event.data,
    });
  }

  async onConsumerCreated(event: IConsumerCreatedEvent) {
    this.log('Consumer Created', event);

    const turnConfig = await this.getTurnConfig();

    event.data['iceServers'] = [turnConfig];

    this.makeObsRequest('func_receive_transport_response', event.data);

    if (this.guestStream.videoId) {
      this.sendWebRTCRequest({
        type: 'getConsumerTrack',
        data: {
          socketId: this.guestStream.socketId,
          streamId: this.guestStream.streamId,
          producerId: this.guestStream.videoId,
          rtpCapabilities: this.auth.rtpCapabilities,
          consumerTransportId: event.data.id,
        },
      });
    }

    if (this.guestStream.audioId) {
      this.sendWebRTCRequest({
        type: 'getConsumerTrack',
        data: {
          socketId: this.guestStream.socketId,
          streamId: this.guestStream.streamId,
          producerId: this.guestStream.audioId,
          rtpCapabilities: this.auth.rtpCapabilities,
          consumerTransportId: event.data.id,
        },
      });
    }
  }

  async onConsumerTrack(event: IConsumerTrackEvent) {
    this.log('Got Consumer Track', event);

    const connectParams = this.makeObsRequest(
      `func_${event.data.kind}_consumer_response`,
      event.data,
    );

    this.log('Got Consumer Connect Params', connectParams);

    // This only needs to be done once, and we don't know which track we will receive first
    if (!this.guestStream.transportConnected) {
      this.sendWebRTCRequest({
        type: 'connectReceiveTransport',
        data: {
          ...connectParams,
          socketId: this.guestStream.socketId,
          streamId: this.guestStream.streamId,
        },
      });

      // TODO: This will never fail
      this.makeObsRequest('func_connect_result', 'true');

      this.guestStream.transportConnected = true;

      this.log('Connected Receive Transport');
    }
  }

  async authenticateSocket(token: string): Promise<ISocketAuthResponse> {
    return new Promise(r => {
      this.socket.emit('authenticate', { token, username: 'Andy' }, r);
    });
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

  private makeObsRequest<TFunc extends keyof IObsReturnTypes>(
    func: TFunc,
    arg?: Object,
  ): IObsReturnTypes[TFunc] {
    let stringArg = arg ?? '';

    if (typeof stringArg === 'object') {
      stringArg = JSON.stringify(arg);
    }

    if (typeof stringArg !== 'string') {
      throw new Error(`Unsupported arg type for OBS call ${arg}`);
    }

    let result = (this.getSource().getObsInput().callHandler(func, stringArg) as any).output;

    if (result !== '') {
      result = JSON.parse(result);
    }

    // Attempt to parse keys as JSON
    Object.keys(result).forEach(k => {
      if (typeof result[k] === 'string') {
        try {
          result[k] = JSON.parse(result[k]);
        } catch {}
      }
    });

    return result;
  }

  private log(...msgs: unknown[]) {
    console.log('[Guest Cam]', ...msgs);
  }
}
