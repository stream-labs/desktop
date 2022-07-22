import { authorizedHeaders, jfetch } from 'util/requests';
import { importSocketIOClient } from 'util/slow-imports';
import { InitAfter, Inject, mutation, StatefulService, Service, ViewHandler } from 'services/core';
import { UserService } from 'services/user';
import uuid from 'uuid/v4';
import { SourcesService } from 'services/sources';
import { ScenesService } from 'services/scenes';
import { EFilterDisplayType, SourceFiltersService } from 'services/source-filters';
import { Subject } from 'rxjs';
import { HardwareService } from 'services/hardware';
import { Producer } from './producer';
import { Consumer } from './consumer';
import { byOS, OS } from 'util/operating-systems';
import { Mutex } from 'util/mutex';
import Utils from 'services/utils';
import { AudioService, E_AUDIO_CHANNELS } from 'services/audio';
import {
  NotificationsService,
  SceneCollectionsService,
  UrlService,
  StreamingService,
} from 'app-services';
import { ENotificationType } from 'services/notifications';
import { $t } from 'services/i18n';
import { JsonrpcService } from 'services/api/jsonrpc';
import { EStreamingState } from 'services/streaming';

/**
 * Interface describing the various functions and expected return values
 * we can make to the plugin using `callHandler`
 */
export interface IObsReturnTypes {
  func_create_send_transport: {};
  func_load_device: {};
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
  func_create_receive_transport: {};
  func_video_consumer_response: {
    connect_params: Object;
  };
  func_audio_consumer_response: {
    connect_params: Object;
  };
  func_stop_consumer: {};
  func_stop_sender: {};
  func_stop_receiver: {};
}

interface IRoomResponse {
  room: string;
}

interface IIoConfigResponse {
  url: string;
  token: string;
  host: {
    name: string;
  };
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
  data: {
    socketId: string;
  };
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

interface IGuest {
  name: string;
  streamId: string;
}

interface IGuestCamServiceState {
  produceOk: boolean;
  videoSourceId: string;
  audioSourceId: string;
  inviteHash: string;
  guestInfo: IGuest;

  /**
   * If we are connecting to as a guest to someone else's stream, this will
   * be set to the hash.
   */
  joinAsGuestHash: string | null;

  /**
   * Name of the host of the room
   */
  hostName: string;
}

interface IInviteLink {
  source_id: string;
  hash: string;
  id: number;
}

interface IInviteLinksResponse {
  links: IInviteLink[];
}

class GuestCamViews extends ViewHandler<IGuestCamServiceState> {
  get videoSourceId() {
    return this.state.videoSourceId;
  }

  get videoSource() {
    return this.getServiceViews(SourcesService).getSource(this.videoSourceId);
  }

  get audioSourceId() {
    return this.state.audioSourceId;
  }

  get audioSource() {
    return this.getServiceViews(SourcesService).getSource(this.audioSourceId);
  }

  get sourceId() {
    return this.getServiceViews(SourcesService).getSourcesByType('mediasoupconnector')[0]?.sourceId;
  }

  get source() {
    return this.getServiceViews(SourcesService).getSource(this.sourceId);
  }

  get deflection() {
    return this.getServiceViews(AudioService).getSource(this.sourceId).fader.deflection;
  }

  get inviteUrl() {
    return `https://join.streamlabs.com/j/${this.state.inviteHash}`;
  }

  get guestVisible() {
    return !this.source?.forceHidden;
  }
}

@InitAfter('SceneCollectionsService')
export class GuestCamService extends StatefulService<IGuestCamServiceState> {
  @Inject() userService: UserService;
  @Inject() sourcesService: SourcesService;
  @Inject() scenesService: ScenesService;
  @Inject() sourceFiltersService: SourceFiltersService;
  @Inject() hardwareService: HardwareService;
  @Inject() sceneCollectionsService: SceneCollectionsService;
  @Inject() notificationsService: NotificationsService;
  @Inject() jsonrpcService: JsonrpcService;
  @Inject() urlService: UrlService;
  @Inject() streamingService: StreamingService;

  static initialState: IGuestCamServiceState = {
    produceOk: false,
    videoSourceId: '',
    audioSourceId: '',
    inviteHash: '',
    guestInfo: null,
    joinAsGuestHash: null,
    hostName: null,
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
  pluginMutex = new Mutex();

  /**
   * Used to ensure we don't try to clean up or start a new socket
   * connect while we are in the process of initializing it.
   */
  socketMutex = new Mutex();

  turnConfig: ITurnConfig;

  init() {
    super.init();

    if (this.views.sourceId) {
      this.startListeningForGuests();
    }

    this.sourcesService.sourceAdded.subscribe(s => {
      if (s.type === 'mediasoupconnector') {
        this.startListeningForGuests();
      }
    });

    this.sourcesService.sourceRemoved.subscribe(s => {
      if (s.type === 'mediasoupconnector') {
        // Only clean up if this is the last mediasoup source
        // There is no use case for multiple sources right now, but
        // we shouldn't break in this scenario
        if (this.sourcesService.views.getSourcesByType('mediasoupconnector').length) return;

        this.cleanUpSocketConnection();
      }
    });

    // Make sure we do this after every single load of the scene collection.
    // This will ensure that if the scene collection did not contain valid
    // sources, we will choose the best ones we can.
    this.sceneCollectionsService.collectionSwitched.subscribe(() => {
      this.findDefaultSources();
    });

    this.streamingService.streamingStatusChange.subscribe(status => {
      if ([EStreamingState.Live, EStreamingState.Offline].includes(status)) {
        this.emitStreamingStatus();
      }
    });
  }

  findDefaultSources() {
    if (
      !this.state.audioSourceId ||
      !this.sourcesService.views.getSource(this.state.audioSourceId)
    ) {
      // Check input channels first
      let audioSource = [
        E_AUDIO_CHANNELS.INPUT_1,
        E_AUDIO_CHANNELS.INPUT_2,
        E_AUDIO_CHANNELS.INPUT_3,
      ]
        .map(channel => {
          return this.sourcesService.views.getSourceByChannel(channel);
        })
        .find(s => s);

      // Fall back to *any* audio source
      if (!audioSource) {
        const sourceType = byOS({
          [OS.Windows]: 'wasapi_input_capture',
          [OS.Mac]: 'coreaudio_input_capture',
        });

        audioSource = this.sourcesService.views.sources.find(s => s.type === sourceType);
      }

      if (audioSource) this.SET_AUDIO_SOURCE(audioSource.sourceId);
    }

    if (
      !this.state.videoSourceId ||
      !this.sourcesService.views.getSource(this.state.videoSourceId)
    ) {
      const sourceType = byOS({ [OS.Windows]: 'dshow_input', [OS.Mac]: 'av_capture_input' });
      const videoSource = this.sourcesService.views.sources.find(s => s.type === sourceType);

      if (videoSource) this.SET_VIDEO_SOURCE(videoSource.sourceId);
    }
  }

  emitStreamingStatus() {
    if (!this.socket) return;

    this.socket.emit('message', {
      target: '*',
      type: 'streamingStatusChange',
      data: {
        live: this.streamingService.views.streamingStatus === EStreamingState.Live,
        chatUrl: this.streamingService.views.chatUrl,
      },
    });
  }

  async startListeningForGuests() {
    await this.socketMutex.do(async () => {
      // TODO: Handle socket disconnects
      if (this.socket) return;

      if (!this.userService.views.isLoggedIn) return;

      await this.ensureInviteLink();

      const roomUrl = this.urlService.getStreamlabsApi('streamrooms/current');
      const roomResult = await jfetch<IRoomResponse>(roomUrl, {
        headers: authorizedHeaders(this.userService.views.auth.apiToken),
      });

      this.log('Room result', roomResult);

      this.room = roomResult.room;

      let ioConfigResult: IIoConfigResponse;

      if (Utils.env.SLD_GUEST_CAM_HASH ?? this.state.joinAsGuestHash) {
        const url = this.urlService.getStreamlabsApi(
          `streamrooms/io/config/${Utils.env.SLD_GUEST_CAM_HASH ?? this.state.joinAsGuestHash}`,
        );
        ioConfigResult = await jfetch<IIoConfigResponse>(url);
      } else {
        const ioConfigUrl = this.urlService.getStreamlabsApi('streamrooms/io/config');
        ioConfigResult = await jfetch<IIoConfigResponse>(ioConfigUrl, {
          headers: authorizedHeaders(this.userService.views.auth.apiToken),
        });
      }

      this.log('io Config Result', ioConfigResult);

      this.SET_HOST_NAME(ioConfigResult.host.name);

      await this.openSocketConnection(ioConfigResult.url, ioConfigResult.token);
    });
  }

  /**
   * This should be called when we are attempting to join somebody else's
   * stream as a guest.
   * @param inviteHash The invite code of the room to join
   */
  async joinAsGuest(inviteHash: string) {
    // TODO: We should show a nice error message
    if (!this.views.sourceId) return;

    await this.cleanUpSocketConnection();
    this.SET_JOIN_AS_GUEST(inviteHash);
    this.SET_PRODUCE_OK(false);
    await this.startListeningForGuests();
    this.sourcesService.showGuestCamPropertiesBySourceId(this.views.sourceId);
  }

  /**
   * Ensures we have exactly one valid invite link
   * @param force If true, will invalidate the old link and generate a new one
   */
  async ensureInviteLink(force = false) {
    const existingLinks = await this.getInviteLinks();

    // Ensure there is only one link (or 0 if we want to regenerate)
    const existingLink = existingLinks.links.shift();

    // Delete all remaining links just in case the exist somehow
    for (const link of existingLinks.links) {
      await this.deleteInviteLink(link.id);
    }

    if (existingLink && !force) {
      this.SET_INVITE_HASH(existingLink.hash);
      return;
    }

    if (existingLink && force) {
      await this.deleteInviteLink(existingLink.id);
    }

    const newLink = await this.createInviteLink(this.views.sourceId);
    this.SET_INVITE_HASH(newLink.hash);
  }

  setProduceOk() {
    this.SET_PRODUCE_OK(true);

    // If a guest is already connected and we are not yet producing, start doing so now.
    // If we are joined as a guest, we should also start producing first.
    if (!this.producer && (this.consumer || this.state.joinAsGuestHash)) {
      this.startProducing();
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

    // Don't hold up starting the producer if the filters can't be created
    try {
      this.ensureSourceAndFilters();
    } catch (e: unknown) {
      this.log('Unable to ensure filters but continuing with producer creation', e);
    }

    this.producer = new Producer();

    await this.producer.connect();
  }

  stopProducing() {
    this.producer.destroy();
    this.producer = null;
  }

  /**
   * Ensures the following:
   * - We have at least 1 guest cam source
   * - We have 1 audio filter and 1 video filter
   * - All sources and filters are updated with the room id
   */
  private ensureSourceAndFilters() {
    if (!this.views.sourceId) {
      throw new Error('Tried to start producer but mediasoup source does not exist');
    }

    // Load volume from source properties manager
    const volume = this.views.source.getPropertiesManagerSettings()['guest_cam_volume'] ?? 255;

    // Remove all existing mediasoup filters
    Object.keys(this.sourceFiltersService.state.filters).forEach(sourceId => {
      this.sourceFiltersService.views.filtersBySourceId(sourceId, true).forEach(filter => {
        if (['mediasoupconnector_afilter', 'mediasoupconnector_vfilter'].includes(filter.type)) {
          this.sourceFiltersService.remove(sourceId, filter.name);
        }
      });
    });

    const videoSource = this.views.videoSource;

    if (!videoSource) {
      throw new Error('Tried to start producer but video source does not exist');
    }

    this.sourceFiltersService.add(
      videoSource.sourceId,
      'mediasoupconnector_vfilter',
      uuid(),
      { room: this.room },
      EFilterDisplayType.Hidden,
    );

    const audioSource = this.views.audioSource;

    if (!audioSource) {
      throw new Error('Tried to start producer but audio source does not exist');
    }

    this.sourceFiltersService.add(
      audioSource.sourceId,
      'mediasoupconnector_afilter',
      uuid(),
      { room: this.room },
      EFilterDisplayType.Hidden,
    );
  }

  async getTurnConfig() {
    if (this.turnConfig && this.turnConfig.expires_at > Date.now()) {
      return this.turnConfig;
    }

    let turnConfigResult: ITurnConfig;

    if (Utils.env.SLD_GUEST_CAM_HASH ?? this.state.joinAsGuestHash) {
      const url = this.urlService.getStreamlabsApi(
        `streamrooms/turn/config/${Utils.env.SLD_GUEST_CAM_HASH ?? this.state.joinAsGuestHash}`,
      );
      turnConfigResult = await jfetch<ITurnConfig>(url);
    } else {
      const turnConfigUrl = this.urlService.getStreamlabsApi('streamrooms/turn/config');
      turnConfigResult = await jfetch<ITurnConfig>(turnConfigUrl, {
        headers: authorizedHeaders(this.userService.views.auth.apiToken),
      });
    }

    this.log('Fetched new TURN config', turnConfigResult);

    return turnConfigResult;
  }

  getInviteLinks() {
    const url = this.urlService.getStreamlabsApi('streamrooms/current');

    return jfetch<IInviteLinksResponse>(url, {
      headers: authorizedHeaders(this.userService.views.auth.apiToken),
    });
  }

  createInviteLink(sourceId: string) {
    const url = this.urlService.getStreamlabsApi(`streamrooms/create-source?source_id=${sourceId}`);

    return jfetch<IInviteLink>(url, {
      method: 'POST',
      headers: authorizedHeaders(this.userService.views.auth.apiToken),
    });
  }

  deleteInviteLink(id: number) {
    const url = this.urlService.getStreamlabsApi(`streamrooms/remove-source?id=${id}`);

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

      this.views.source.updateSettings({ room: this.room });

      this.makeObsRequest('func_load_device', this.auth.rtpCapabilities);
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

    if (this.disconnectedStreamIds.includes(event.data.streamId)) {
      this.log(`Ignoring previously disconnected stream id ${event.data.streamId}`);
      return;
    }

    this.log('New guest joined', event);

    this.SET_GUEST({ name: event.data.name, streamId: event.data.streamId });

    // Clean up any existing consumer before connecting the new one
    if (this.consumer) {
      this.consumer.destroy();
    }

    // If we're allowed to produce, we should start producing right now
    if (!this.producer && this.state.produceOk) {
      this.startProducing();
    }

    this.consumer = new Consumer(event.data);
    this.consumer.connect();

    // Make sure the source isn't visible in any scene
    this.views.source.setForceHidden(true);
    this.views.source.setForceMuted(true);

    this.emitStreamingStatus();

    this.notificationsService.push({
      type: ENotificationType.SUCCESS,
      lifeTime: -1,
      message: $t('A guest has joined - click to show'),
      action: this.jsonrpcService.createRequest(
        Service.getResourceId(this.sourcesService),
        'showGuestCamPropertiesBySourceId',
        this.views.sourceId,
      ),
    });
  }

  disconnectedStreamIds: string[] = [];

  /**
   * Disconnects the currently connected guest
   */
  disconnectGuest() {
    // Add the stream id to the list of disconnected guests, so we don't
    // immediately connect to that same guest again until they are forced
    // to refresh the page.
    if (this.state.guestInfo && !this.state.joinAsGuestHash) {
      this.disconnectedStreamIds.push(this.state.guestInfo.streamId);
    }

    this.cleanUpSocketConnection();
    this.startListeningForGuests();
  }

  async cleanUpSocketConnection() {
    await this.socketMutex.synchronize();

    if (!this.socket) return;

    if (this.consumer) {
      this.consumer.destroy();
      this.consumer = null;
    }

    // Also stop sending our mic/video
    // When we do multi-guest this will need to change
    if (this.producer) {
      this.producer.destroy();
      this.producer = null;
    }

    // TODO: AFAIK there is no way to cleanly recreate the producer without
    // entirely disconnecting destroying all state on the server. For now, we
    // disconnect from the socket and start listening to guests again.
    this.socket.disconnect();
    this.socket = null;
    this.SET_GUEST(null);
    this.SET_JOIN_AS_GUEST(null);
  }

  setVisibility(visible: boolean) {
    if (!this.views.source) return;

    this.views.source.setForceHidden(!visible);
    this.views.source.setForceMuted(!visible);
  }

  async onGuestLeave(event: IConsumerDestroyedEvent) {
    this.log('Guest left', event);

    if (this.consumer && this.consumer.remoteProducer.socketId === event.data.socketId) {
      this.consumer.destroy();
      this.consumer = null;
      this.SET_GUEST(null);
    }
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

  sendWebRTCRequest(data: Object) {
    return new Promise(resolve => {
      this.socket.emit('webrtc', data, (result: Object) => {
        if (result && result['error']) {
          this.error(`Got error response from request ${data['type']}`);
        }

        resolve(result);
      });
    });
  }

  makeObsRequest<TFunc extends keyof IObsReturnTypes>(
    func: TFunc,
    arg?: Object,
  ): IObsReturnTypes[TFunc] {
    // If underlying source is destroyed, do nothing
    if (!this.views.source) {
      this.log(`Ignoring OBS call ${func} due to source not existing`);
      return;
    }

    let stringArg = arg ?? '';

    if (typeof stringArg === 'object') {
      stringArg = JSON.stringify(arg);
    }

    if (typeof stringArg !== 'string') {
      throw new Error(`Unsupported arg type for OBS call ${arg}`);
    }

    let result = (this.views.source.getObsInput().callHandler(func, stringArg) as any).output;

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

  error(...msgs: unknown[]) {
    console.error('[Guest Cam]', ...msgs);
  }

  setVideoSource(sourceId: string) {
    if (!this.sourcesService.views.getSource(sourceId)) return;

    this.SET_VIDEO_SOURCE(sourceId);

    if (this.producer && this.views.sourceId) {
      this.ensureSourceAndFilters();
    }
  }

  setAudioSource(sourceId: string) {
    if (!this.sourcesService.views.getSource(sourceId)) return;

    this.SET_AUDIO_SOURCE(sourceId);

    if (this.producer && this.views.sourceId) {
      this.ensureSourceAndFilters();
    }
  }

  @mutation()
  private SET_PRODUCE_OK(val: boolean) {
    this.state.produceOk = val;
  }

  @mutation()
  private SET_VIDEO_SOURCE(sourceId: string) {
    this.state.videoSourceId = sourceId;
  }

  @mutation()
  private SET_AUDIO_SOURCE(sourceId: string) {
    this.state.audioSourceId = sourceId;
  }

  @mutation()
  private SET_INVITE_HASH(hash: string) {
    this.state.inviteHash = hash;
  }

  @mutation()
  private SET_GUEST(guest: IGuest) {
    this.state.guestInfo = guest;
  }

  @mutation()
  private SET_JOIN_AS_GUEST(inviteHash: string | null) {
    this.state.joinAsGuestHash = inviteHash;
  }

  @mutation()
  private SET_HOST_NAME(name: string) {
    this.state.hostName = name;
  }
}
