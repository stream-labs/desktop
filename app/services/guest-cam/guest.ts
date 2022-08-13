import { Subscription } from 'rxjs';
import { IConsumerCreatedEvent, IRemoteProducer } from '.';
import { GuestTrack } from './guest-track';
import { MediasoupEntity } from './mediasoup-entity';

interface IGuestConstructorOptions {
  remoteProducer: IRemoteProducer;

  /**
   * Source id doesn't need to be immediately assigned
   */
  sourceId?: string;
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
      if (
        event.type === 'consumerCreated' &&
        event.data.streamId === this.opts.remoteProducer.streamId
      ) {
        this.onConsumerCreated(event);
      }
    });

    this.sendWebRTCRequest({
      type: 'createConsumer',
      data: this.opts.remoteProducer,
    });
  }

  onConsumerCreated(event: IConsumerCreatedEvent) {
    this.log('Consumer Created', event);

    this.transportId = event.data.id;

    this.withMutex(async () => {
      if (!this.guestCamService.consumer.transportConnected) {
        this.guestCamService.consumer.createTransport(event);
      }

      if (this.sourceId) await this.createTracks();
      this.unlockMutex();
    });
  }

  async createTracks() {
    if (this.opts.remoteProducer.audioId) {
      this.audioTrack = new GuestTrack({
        kind: 'audio',
        trackId: this.opts.remoteProducer.audioId,
        socketId: this.opts.remoteProducer.socketId,
        streamId: this.opts.remoteProducer.streamId,
        transportId: this.transportId,
        sourceId: this.sourceId,
      });

      await this.audioTrack.connect();
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

      await this.videoTrack.connect();
    }
  }

  get streamId() {
    return this.opts.remoteProducer.streamId;
  }

  /**
   * Sets the source this guest should play on.
   * Calling without a sourceId will stop playing this guest
   * @param sourceId The id of the source to play on
   */
  setSource(sourceId?: string) {
    this.withMutex(async () => {
      this.sourceId = sourceId;

      if (this.audioTrack) {
        this.audioTrack.destroy();
        this.audioTrack = null;
      }

      if (this.videoTrack) {
        this.videoTrack.destroy();
        this.videoTrack = null;
      }

      if (sourceId) await this.createTracks();
      this.unlockMutex();
    });
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
