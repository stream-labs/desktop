import { Subscription } from 'rxjs';
import { IConsumerCreatedEvent, IConsumerTrackEvent, IRemoteProducer, TConnectParams } from '.';
import { Guest } from './guest';
import { MediasoupEntity } from './mediasoup-entity';

export class Consumer extends MediasoupEntity {
  webrtcSubscription: Subscription;

  transportConnected = false;
  transportId: string;
  guest: Guest;

  destroyed = false;

  constructor(public readonly sourceId: string, public readonly remoteProducer: IRemoteProducer) {
    super(sourceId);
  }

  async connect() {
    this.webrtcSubscription = this.guestCamService.webrtcEvent.subscribe(event => {
      if (event.type === 'consumerCreated') {
        this.onConsumerCreated(event);
      }
    });

    this.sendWebRTCRequest({
      type: 'createConsumer',
      data: this.remoteProducer,
    });
  }

  async onConsumerCreated(event: IConsumerCreatedEvent) {
    this.log('Consumer Created', event);

    this.transportId = event.data.id;

    const turnConfig = await this.guestCamService.getTurnConfig();

    event.data['iceServers'] = [turnConfig];

    // TODO: Talk to Steven about how much synchronization is really needed here.
    // For now, just hold up creating the receive transport until the mutext is unlocked.
    await this.guestCamService.pluginMutex.synchronize();

    this.makeObsRequest('func_create_receive_transport', event.data);

    this.addGuest(this.sourceId, this.remoteProducer);
  }

  addGuest(sourceId: string, remoteProducer: IRemoteProducer) {
    console.log('ADD GUEST');

    this.guest = new Guest({
      name: remoteProducer.name,
      socketId: remoteProducer.socketId,
      streamId: remoteProducer.streamId,
      transportId: this.transportId,
      audioId: remoteProducer.audioId,
      videoId: remoteProducer.videoId,
      sourceId,
    });

    this.guest.connect();
  }

  /**
   * Connects this transport on the server side
   * @param connectParams Data blob the shape of which is opaque to us
   */
  async connectOnServer(connectParams: TConnectParams) {
    this.sendWebRTCRequest({
      type: 'connectReceiveTransport',
      data: {
        ...connectParams,
        socketId: this.remoteProducer.socketId,
        streamId: this.remoteProducer.streamId,
      },
    });

    this.makeObsRequest('func_connect_result', 'true');

    this.transportConnected = true;

    this.log('Connected Receive Transport');
  }

  destroy() {
    if (this.webrtcSubscription) {
      this.webrtcSubscription.unsubscribe();
      this.webrtcSubscription = null;
    }

    this.makeObsRequest('func_stop_consumer', this.remoteProducer.audioId);
    this.makeObsRequest('func_stop_consumer', this.remoteProducer.videoId);
    this.makeObsRequest('func_stop_receiver');

    super.destroy();
  }
}
