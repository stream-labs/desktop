import { Subscription } from 'rxjs';
import { IConsumerCreatedEvent, IConsumerTrackEvent, IRemoteProducer } from '.';
import { MediasoupEntity } from './mediasoup-entity';

export class Consumer extends MediasoupEntity {
  webrtcSubscription: Subscription;

  transportConnected = false;
  hasAudio = false;
  hasVideo = false;
  audioSubscribed = false;
  videoSubscribed = false;

  destroyed = false;

  constructor(public readonly remoteProducer: IRemoteProducer) {
    super();
  }

  async connect() {
    return this.withMutex(() => {
      this.webrtcSubscription = this.guestCamService.webrtcEvent.subscribe(event => {
        if (event.type === 'consumerCreated') {
          this.onConsumerCreated(event);
        } else if (event.type === 'consumerTrack') {
          this.onConsumerTrack(event);
        }
      });

      this.sendWebRTCRequest({
        type: 'createConsumer',
        data: this.remoteProducer,
      });
    });
  }

  onConsumerCreated(event: IConsumerCreatedEvent) {
    return this.withMutex(async () => {
      this.log('Consumer Created', event);

      const turnConfig = await this.guestCamService.getTurnConfig();

      event.data['iceServers'] = [turnConfig];

      this.makeObsRequest('func_create_receive_transport', event.data);

      if (this.remoteProducer.videoId) {
        this.hasVideo = true;
        this.sendWebRTCRequest({
          type: 'getConsumerTrack',
          data: {
            socketId: this.remoteProducer.socketId,
            streamId: this.remoteProducer.streamId,
            producerId: this.remoteProducer.videoId,
            rtpCapabilities: this.guestCamService.auth.rtpCapabilities,
            consumerTransportId: event.data.id,
            paused: true,
          },
        });
      }

      if (this.remoteProducer.audioId) {
        this.hasAudio = true;
        this.sendWebRTCRequest({
          type: 'getConsumerTrack',
          data: {
            socketId: this.remoteProducer.socketId,
            streamId: this.remoteProducer.streamId,
            producerId: this.remoteProducer.audioId,
            rtpCapabilities: this.guestCamService.auth.rtpCapabilities,
            consumerTransportId: event.data.id,
          },
        });
      }
    });
  }

  onConsumerTrack(event: IConsumerTrackEvent) {
    return this.withMutex(() => {
      this.log('Got Consumer Track', event);

      const connectParams = this.makeObsRequest(
        `func_${event.data.kind}_consumer_response`,
        event.data,
      ).connect_params;

      this.log('Got Consumer Connect Params', connectParams);

      if (event.data.paused) {
        this.sendWebRTCRequest({
          type: 'resumeConsumerTrack',
          data: {
            socketId: this.remoteProducer.socketId,
            streamId: this.remoteProducer.streamId,
            producerId: event.data.producerId,
            consumerId: event.data.id,
          },
        });
      }

      // This only needs to be done once, and we don't know which track we will receive first
      if (!this.transportConnected) {
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

      if (event.data.kind === 'audio') this.audioSubscribed = true;
      if (event.data.kind === 'video') this.videoSubscribed = true;

      // Figure out if we're completely done to unlock the mutex
      if ((this.hasAudio && this.audioSubscribed) || !this.hasAudio) {
        if ((this.hasVideo && this.videoSubscribed) || !this.hasVideo) {
          this.unlockMutex();
        }
      }
    });
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
