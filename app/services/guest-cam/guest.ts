import { Subscription } from 'rxjs';
import { IConsumerCreatedEvent, IRemoteProducer } from '.';
import { GuestTrack } from './guest-track';
import { MediasoupEntity } from './mediasoup-entity';

interface IGuestConstructorOptions {
  remoteProducer: IRemoteProducer;
}

export class Guest extends MediasoupEntity {
  webrtcSubscription: Subscription;

  transportId: string;

  audioTrack: GuestTrack;
  videoTrack: GuestTrack;
  screenshareTrack: GuestTrack;

  // This resolves a rare race condition where we try to create
  // tracks before the consumer has been created.
  consumerCreatedReady: () => void;
  consumerCreatedPromise = new Promise<void>(r => (this.consumerCreatedReady = r));

  constructor(public readonly opts: IGuestConstructorOptions) {
    super(undefined);
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
      if (!this.guestCamService.consumer.transportCreated) {
        await this.guestCamService.consumer.createTransport(event);
      }

      // We need to requestTrack for screenshare in order to receive "Stop Sharing" events
      // TODO: create in paused state and resume when assigned, even though we're not rendering
      if (this.opts.remoteProducer.type === 'screenshare') {
        this.screenshareTrack = new GuestTrack({
          kind: 'video',
          trackId: this.opts.remoteProducer.videoId,
          socketId: this.opts.remoteProducer.socketId,
          streamId: this.opts.remoteProducer.streamId,
          transportId: this.transportId,
          sourceId: this.sourceId,
        });

        this.screenshareTrack.requestTrack();
      }

      this.consumerCreatedReady();
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

    if (this.opts.remoteProducer.videoId && this.opts.remoteProducer.type !== 'screenshare') {
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

    if (this.opts.remoteProducer.type === 'screenshare') {
      // Replace screenshare track as we need to reassign source ID
      this.screenshareTrack = new GuestTrack({
        kind: 'video',
        trackId: this.opts.remoteProducer.videoId,
        socketId: this.opts.remoteProducer.socketId,
        streamId: this.opts.remoteProducer.streamId,
        transportId: this.transportId,
        sourceId: this.sourceId,
      });

      await this.screenshareTrack.connect();
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
  async setSource(sourceId?: string) {
    await this.consumerCreatedPromise;

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

      if (this.screenshareTrack) {
        this.screenshareTrack.destroy();
        this.screenshareTrack = null;
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

    [this.audioTrack, this.videoTrack, this.screenshareTrack].forEach(track => {
      if (track) {
        track.destroy();
      }
    });

    super.destroy();
  }
}
