import { authorizedHeaders, jfetch } from 'util/requests';
import { importSocketIOClient } from 'util/slow-imports';
import {
  InitAfter,
  Inject,
  mutation,
  PersistentStatefulService,
  StatefulService,
  ViewHandler,
} from 'services/core';
import { UserService } from 'services/user';
import uuid from 'uuid/v4';
import { SourcesService } from 'services/sources';
import { ScenesService } from 'services/scenes';
import { EFilterDisplayType, SourceFiltersService } from 'services/source-filters';
import { Subject, Subscription } from 'rxjs';
import { EDeviceType, HardwareService } from 'services/hardware';
import { MediasoupEntity } from './mediasoup-entity';
import { Producer } from './producer';
import { Consumer } from './consumer';
import { byOS, OS } from 'util/operating-systems';
import { Mutex } from 'util/mutex';
import Utils from 'services/utils';

/**
 * Interface describing the various functions and expected return values
 * we can make to the plugin using `callHandler`
 */
export interface IObsReturnTypes {
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
    connect_params: Object;
  };
  func_audio_consumer_response: {
    connect_params: Object;
  };
  func_stop_consumer: {};
  func_stop_sender: {};
  func_change_playback_volume: {};
}

interface IRoomResponse {
  room: string;
}

interface IIoConfigResponse {
  url: string;
  token: string;
}

type TWebRTCSocketEvent =
  | IProducerCreatedEvent
  | IConsumerCreatedEvent
  | IConsumerTrackEvent
  | IConsumerDestroyedEvent;

export interface IRemoteProducer {
  audioId: string;
  name: string;
  socketId: string;
  streamId: string;
  type: string;
  videoId: string;
}

interface IProducerCreatedEvent {
  type: 'producerCreated';
  data: IRemoteProducer;
}

export interface IConsumerCreatedEvent {
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

export interface IConsumerTrackEvent {
  type: 'consumerTrack';
  data: {
    kind: 'audio' | 'video';
    paused: boolean;
    producerId: string;
    id: string;
  };
}

// TODO: What does this look like?
interface IConsumerDestroyedEvent {
  type: 'consumerDestroyed';
}

interface ISocketAuthResponse {
  success: boolean;
  rtpCapabilities: unknown;
}

interface ITurnConfig {
  expires_at: number;
  credential: string;
  urls: string[];
  username: string;
}

export enum EGuestCamStatus {
  Offline = 'offline',
  Connected = 'connected',
  Busy = 'busy',
}

interface IGuest {
  name: string;
  visible: boolean;
}

interface IGuestCamServiceState {
  status: EGuestCamStatus;
  videoDevice: string;
  audioDevice: string;
  inviteHash: string;
  guestInfo: IGuest;
}

interface IInviteLink {
  source_id: string;
  hash: string;
}

interface IInviteLinksResponse {
  links: IInviteLink[];
}

class GuestCamViews extends ViewHandler<IGuestCamServiceState> {
  get videoDevice() {
    return this.state.videoDevice;
  }

  get audioDevice() {
    return this.state.audioDevice;
  }

  /**
   * Finds an existing source in the current scene collection that matches
   * the selected video device. This is a somewhat slow operation because
   * we need to fetch the settings from OBS.
   * @returns The source
   */
  findVideoSource() {
    const sourceType = byOS({ [OS.Windows]: 'dshow_input', [OS.Mac]: 'av_capture_input' });
    const deviceProperty = byOS({ [OS.Windows]: 'video_device_id', [OS.Mac]: 'device' });

    return this.getServiceViews(SourcesService).sources.find(s => {
      return s.type === sourceType && s.getSettings()[deviceProperty] === this.videoDevice;
    });
  }

  /**
   * Finds an existing source in the current scene collection that matches
   * the selected audio device. This is a somewhat slow operation because
   * we need to fetch the settings from OBS.
   * @returns The source
   */
  findAudioSource() {
    const sourceType = byOS({
      [OS.Windows]: 'wasapi_input_capture',
      [OS.Mac]: 'coreaudio_input_capture',
    });

    return this.getServiceViews(SourcesService).sources.find(s => {
      return s.type === sourceType && s.getSettings().device_id === this.audioDevice;
    });
  }
}

@InitAfter('SourcesService')
export class GuestCamService extends PersistentStatefulService<IGuestCamServiceState> {
  @Inject() userService: UserService;
  @Inject() sourcesService: SourcesService;
  @Inject() scenesService: ScenesService;
  @Inject() sourceFiltersService: SourceFiltersService;
  @Inject() hardwareService: HardwareService;

  static defaultState: IGuestCamServiceState = {
    status: EGuestCamStatus.Offline,
    videoDevice: '',
    audioDevice: '',
    inviteHash: '',
    guestInfo: null,
  };

  get views() {
    return new GuestCamViews(this.state);
  }

  /**
   * Event bus for various utility classes to subscribe/unsubscribe
   * from webrtc events coming over the socket.
   */
  webrtcEvent = new Subject<TWebRTCSocketEvent>();

  io: SocketIOClientStatic;
  socket: SocketIOClient.Socket;
  room: string;
  auth: ISocketAuthResponse;

  producer: Producer;
  consumer: Consumer;

  /**
   * The mediasoup plugin will get in a bad state if we try setting
   * up the consumer while the producer is being set up. This mutex
   * ensures that only one operation accesses the plugin at a time.
   */
  mutex = new Mutex();

  turnConfig: ITurnConfig;

  init() {
    super.init();

    this.SET_STATUS(EGuestCamStatus.Offline);
    this.SET_INVITE_HASH('');
    this.SET_GUEST(null);

    // TODO - check default hardware service instead of taking first in list?
    if (this.state.audioDevice === '') {
      const firstAudioDevice = this.hardwareService.devices.find(
        d => d.type === EDeviceType.audioInput,
      );

      if (firstAudioDevice) this.SET_AUDIO_DEVICE(firstAudioDevice.id);
    }

    if (this.state.videoDevice === '') {
      const firstVideoDevice = this.hardwareService.dshowDevices[0];

      if (firstVideoDevice) this.SET_VIDEO_DEVICE(firstVideoDevice.id);
    }

    if (this.getSourceId()) {
      this.startListeningForGuests();
    }

    this.sourcesService.sourceAdded.subscribe(s => {
      if (s.type === 'mediasoupconnector') {
        this.startListeningForGuests();
      }
    });
  }

  async startListeningForGuests() {
    // TODO: Handle socket disconnects
    if (this.socket) return;

    await this.ensureInviteLink();

    const roomUrl = 'https://stage6.streamlabs.com/api/v5/slobs/streamrooms/current';
    const roomResult = await jfetch<IRoomResponse>(roomUrl, {
      headers: authorizedHeaders(this.userService.views.auth.apiToken),
    });

    this.log('Room result', roomResult);

    this.room = roomResult.room;

    let ioConfigResult: IIoConfigResponse;

    if (Utils.env.SLD_GUEST_CAM_HASH) {
      const url = `https://stage6.streamlabs.com/api/v5/slobs/streamrooms/io/config/${Utils.env.SLD_GUEST_CAM_HASH}`;
      ioConfigResult = await jfetch<IIoConfigResponse>(url);
    } else {
      const ioConfigUrl = 'https://stage6.streamlabs.com/api/v5/slobs/streamrooms/io/config';
      ioConfigResult = await jfetch<IIoConfigResponse>(ioConfigUrl, {
        headers: authorizedHeaders(this.userService.views.auth.apiToken),
      });
    }

    this.log('io Config Result', ioConfigResult);

    this.openSocketConnection(ioConfigResult.url, ioConfigResult.token);
  }

  async ensureInviteLink() {
    const existingLinks = await this.getInviteLinks();

    // For now we don't worry about tying invite links to individual guests.
    // Just use whatever links already exist
    if (existingLinks.links.length) {
      this.SET_INVITE_HASH(existingLinks.links[0].hash);
    } else {
      const link = await this.createInviteLink(this.getSourceId());
      this.SET_INVITE_HASH(link.hash);
    }
  }

  /**
   * The main function to connect to the remote service with A/V.
   * The following will happen:
   * - We will ensure sources/filters are set up properly
   * - We will start sending A/V to the remote server
   */
  async startProducing() {
    // TODO: What happens if the producer isn't working?
    if (this.producer) return;

    this.SET_STATUS(EGuestCamStatus.Busy);

    this.ensureSourceAndFilters(this.room);

    this.producer = new Producer();

    await this.producer.connect();

    this.SET_STATUS(EGuestCamStatus.Connected);
  }

  stopProducing() {
    this.producer.destroy();
    this.producer = null;
    this.SET_STATUS(EGuestCamStatus.Offline);
  }

  /**
   * Ensures the following:
   * - We have at least 1 guest cam source
   * - We have 1 audio filter and 1 video filter
   * - All sources and filters are updated with the room id
   */
  private ensureSourceAndFilters(roomId: string) {
    if (!this.getSourceId()) {
      throw new Error('Tried to start producer but mediasoup source does not exist');
    }

    // Remove all existing mediasoup filters
    Object.keys(this.sourceFiltersService.state.filters).forEach(sourceId => {
      this.sourceFiltersService.views.filtersBySourceId(sourceId, true).forEach(filter => {
        if (['mediasoupconnector_afilter', 'mediasoupconnector_vfilter'].includes(filter.type)) {
          this.sourceFiltersService.remove(sourceId, filter.name);
        }
      });
    });

    const videoSource = this.views.findVideoSource();

    if (!videoSource) {
      throw new Error('Tried to start producer but video source does not exist');
    }

    this.sourceFiltersService.add(
      videoSource.sourceId,
      'mediasoupconnector_vfilter',
      uuid(),
      { room: roomId },
      EFilterDisplayType.Hidden,
    );

    const audioSource = this.views.findAudioSource();

    if (!audioSource) {
      throw new Error('Tried to start producer but audio source does not exist');
    }

    this.sourceFiltersService.add(
      audioSource.sourceId,
      'mediasoupconnector_afilter',
      uuid(),
      { room: roomId },
      EFilterDisplayType.Hidden,
    );
  }

  async getTurnConfig() {
    if (this.turnConfig && this.turnConfig.expires_at > Date.now()) {
      return this.turnConfig;
    }

    let turnConfigResult: ITurnConfig;

    if (Utils.env.SLD_GUEST_CAM_HASH) {
      const url = `https://stage6.streamlabs.com/api/v5/slobs/streamrooms/turn/config/${Utils.env.SLD_GUEST_CAM_HASH}`;
      turnConfigResult = await jfetch<ITurnConfig>(url);
    } else {
      const turnConfigUrl = 'https://stage6.streamlabs.com/api/v5/slobs/streamrooms/turn/config';
      turnConfigResult = await jfetch<ITurnConfig>(turnConfigUrl, {
        headers: authorizedHeaders(this.userService.views.auth.apiToken),
      });
    }

    this.log('Fetched new TURN config', turnConfigResult);

    return turnConfigResult;
  }

  getInviteLinks() {
    const url = 'https://stage6.streamlabs.com/api/v5/slobs/streamrooms/current';

    return jfetch<IInviteLinksResponse>(url, {
      headers: authorizedHeaders(this.userService.views.auth.apiToken),
    });
  }

  createInviteLink(sourceId: string) {
    const url = `https://stage6.streamlabs.com/api/v5/slobs/streamrooms/create-source?source_id=${sourceId}`;

    return jfetch<IInviteLink>(url, {
      method: 'POST',
      headers: authorizedHeaders(this.userService.views.auth.apiToken),
    });
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

      this.getSource().updateSettings({ room: this.room });

      this.makeObsRequest('func_routerRtpCapabilities', this.auth.rtpCapabilities);
    });
    this.socket.on('connect_error', (e: any) => this.log('Connection Error', e));
    this.socket.on('connect_timeout', () => this.log('Connection Timeout'));
    this.socket.on('error', () => this.log('Socket Error'));
    this.socket.on('disconnect', () => this.log('Connection Closed'));
    this.socket.on('webrtc', (e: TWebRTCSocketEvent) => this.onWebRTC(e));
  }

  onWebRTC(event: TWebRTCSocketEvent) {
    this.log('WebRTC Event', event);

    this.webrtcEvent.next(event);

    if (event.type === 'producerCreated') {
      this.onGuestJoin(event);
    } else if (event.type === 'consumerDestroyed') {
      this.onGuestLeave(event);
    }
  }

  async onGuestJoin(event: IProducerCreatedEvent) {
    if (this.socket.id === event.data.socketId) {
      this.log('onProducerCreated fired - ignoring our own producer');
      return;
    }

    this.log('New guest joined', event);

    // Clean up any existing consumer before connecting the new one
    if (this.consumer) {
      this.consumer.destroy();
    }

    // Make sure the source isn't visible in any scene
    // this.getSource().setForceHidden(true);

    // Set audio volume to 0 until the guest is approved
    // this.makeObsRequest('func_change_playback_volume', '0');

    this.consumer = new Consumer(event.data);
    this.consumer.connect();
  }

  async onGuestLeave(event: IConsumerDestroyedEvent) {
    this.log('ON GUEST LEAVE', event);
  }

  async authenticateSocket(token: string): Promise<ISocketAuthResponse> {
    return new Promise(r => {
      this.socket.emit(
        'authenticate',
        { token, username: this.userService.views.platform.username },
        r,
      );
    });
  }

  sendWebRTCRequest(data: unknown) {
    return new Promise(resolve => {
      this.socket.emit('webrtc', data, resolve);
    });
  }

  getSourceId() {
    return this.sourcesService.views.getSourcesByType('mediasoupconnector')[0]?.sourceId;
  }

  getSource() {
    return this.sourcesService.views.getSource(this.getSourceId());
  }

  makeObsRequest<TFunc extends keyof IObsReturnTypes>(
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

  log(...msgs: unknown[]) {
    console.log('[Guest Cam]', ...msgs);
  }

  setVideoDevice(device: string) {
    this.SET_VIDEO_DEVICE(device);
  }

  setAudioDevice(device: string) {
    this.SET_AUDIO_DEVICE(device);
  }

  @mutation()
  private SET_STATUS(status: EGuestCamStatus) {
    this.state.status = status;
  }

  @mutation()
  private SET_VIDEO_DEVICE(device: string) {
    this.state.videoDevice = device;
  }

  @mutation()
  private SET_AUDIO_DEVICE(device: string) {
    this.state.audioDevice = device;
  }

  @mutation()
  private SET_INVITE_HASH(hash: string) {
    this.state.inviteHash = hash;
  }

  @mutation()
  private SET_GUEST(guest: IGuest) {
    this.state.guestInfo = guest;
  }
}
