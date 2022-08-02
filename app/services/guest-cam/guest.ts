import { Subscription } from 'rxjs';
import { IConsumerCreatedEvent, IRemoteProducer } from '.';
import { GuestTrack } from './guest-track';
import { MediasoupEntity } from './mediasoup-entity';

interface IGuestConstructorOptions {
  remoteProducer: IRemoteProducer;
  sourceId: string;
}

export class Guest extends MediasoupEntity {
  webrtcSubscription: Subscription;

  transportId: string;

  audioTrack: GuestTrack;
  videoTrack: GuestTrack;

  constructor(public readonly opts: IGuestConstructorOptions) {
    super(opts.sourceId);
  }

  connect() {
    this.webrtcSubscription = this.guestCamService.webrtcEvent.subscribe(event => {
      if (event.type === 'consumerCreated') {
        this.onConsumerCreated(event);
      }
    });

    this.sendWebRTCRequest({
      type: 'createConsumer',
      data: this.opts.remoteProducer,
    });
  }

  async onConsumerCreated(event: IConsumerCreatedEvent) {
    this.log('Consumer Created', event);

    this.transportId = event.data.id;

    if (!this.guestCamService.consumer.transportConnected) {
      const turnConfig = await this.guestCamService.getTurnConfig();

      event.data['iceServers'] = [turnConfig];

      // TODO: Talk to Steven about how much synchronization is really needed here.
      // For now, just hold up creating the receive transport until the mutext is unlocked.
      await this.guestCamService.pluginMutex.synchronize();

      this.makeObsRequest('func_create_receive_transport', event.data);
    }

    this.createTracks();
  }

  createTracks() {
    if (this.opts.remoteProducer.audioId) {
      this.audioTrack = new GuestTrack({
        kind: 'audio',
        trackId: this.opts.remoteProducer.audioId,
        socketId: this.opts.remoteProducer.socketId,
        streamId: this.opts.remoteProducer.streamId,
        transportId: this.transportId,
        sourceId: this.sourceId,
      });

      this.audioTrack.connect();
    }

    if (this.opts.remoteProducer.videoId) {
      this.videoTrack = new GuestTrack({
        kind: 'video',
        trackId: this.opts.remoteProducer.videoId,
        socketId: this.opts.remoteProducer.socketId,
        streamId: this.opts.remoteProducer.streamId,
        transportId: this.transportId,
        sourceId: this.sourceId,
      });

      this.videoTrack.connect();
    }
  }

  get streamId() {
    return this.opts.remoteProducer.streamId;
  }

  destroy() {
    if (this.webrtcSubscription) {
      this.webrtcSubscription.unsubscribe();
      this.webrtcSubscription = null;
    }

    if (this.audioTrack) this.audioTrack.destroy();
    if (this.videoTrack) this.videoTrack.destroy();

    super.destroy();
  }
}
