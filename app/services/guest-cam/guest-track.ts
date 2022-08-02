import { Subscription } from 'rxjs';
import { IConsumerTrackEvent } from '.';
import { MediasoupEntity } from './mediasoup-entity';

type TTrackKind = 'audio' | 'video';

interface IGuestTrackConstructorOptions {
  kind: TTrackKind;
  trackId: string;
  socketId: string;
  streamId: string;
  transportId: string;
  sourceId: string;
}

export class GuestTrack extends MediasoupEntity {
  webrtcSubscription: Subscription;

  constructor(public readonly opts: IGuestTrackConstructorOptions) {
    super(opts.sourceId);
  }

  connect() {
    this.webrtcSubscription = this.guestCamService.webrtcEvent.subscribe(event => {
      if (event.type === 'consumerTrack' && event.data.producerId === this.opts.trackId) {
        this.playTrack(event);
      }
    });

    this.requestTrack();
  }

  /**
   * Requests this track from the server
   */
  private requestTrack() {
    this.sendWebRTCRequest({
      type: 'getConsumerTrack',
      data: {
        socketId: this.opts.socketId,
        streamId: this.opts.streamId,
        producerId: this.opts.trackId,
        consumerTransportId: this.opts.transportId,
        rtpCapabilities: this.guestCamService.auth.rtpCapabilities,
        paused: this.opts.kind === 'video',
      },
    });
  }

  /**
   * Takes a track we received from the server and connects it to the C++ source
   */
  private playTrack(event: IConsumerTrackEvent) {
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
          socketId: this.opts.socketId,
          streamId: this.opts.streamId,
          producerId: event.data.producerId,
          consumerId: event.data.id,
        },
      });
    }

    // We will only get back connect params if the transport is unconnected.
    // This is kind of gross and breaks separation of concerns, but if we
    // are the first track to be added on this transport, we are responsible
    // for connecting the parent transport.
    if (connectParams && !this.guestCamService.consumer.transportConnected) {
      this.guestCamService.consumer.connectTransport(connectParams);
    }
  }

  destroy() {
    if (this.webrtcSubscription) {
      this.webrtcSubscription.unsubscribe();
      this.webrtcSubscription = null;
    }

    this.makeObsRequest('func_stop_consumer', this.opts.trackId);

    super.destroy();
  }
}
