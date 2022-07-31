import { GuestTrack } from './guest-track';
import { MediasoupEntity } from './mediasoup-entity';

interface IGuestConstructorOptions {
  name: string;
  socketId: string;
  streamId: string;
  transportId: string;
  audioId?: string;
  videoId?: string;
  sourceId: string;
}

export class Guest extends MediasoupEntity {
  audioTrack: GuestTrack;
  videoTrack: GuestTrack;

  constructor(public readonly opts: IGuestConstructorOptions) {
    super(opts.sourceId);
  }

  connect() {
    if (this.opts.audioId) {
      this.audioTrack = new GuestTrack({
        kind: 'audio',
        trackId: this.opts.audioId,
        socketId: this.opts.socketId,
        streamId: this.opts.streamId,
        transportId: this.opts.transportId,
        sourceId: this.sourceId,
      });

      this.audioTrack.connect();
    }

    if (this.opts.videoId) {
      this.videoTrack = new GuestTrack({
        kind: 'video',
        trackId: this.opts.videoId,
        socketId: this.opts.socketId,
        streamId: this.opts.streamId,
        transportId: this.opts.transportId,
        sourceId: this.sourceId,
      });

      this.videoTrack.connect();
    }
  }
}
