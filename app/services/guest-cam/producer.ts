import { MediasoupEntity } from './mediasoup-entity';
import uuid from 'uuid/v4';

export class Producer extends MediasoupEntity {
  connected = false;

  async connect() {
    return this.withMutex(async () => {
      const streamId = uuid();
      const result = await this.sendWebRTCRequest({
        type: 'createProducer',
        data: { streamId, type: 'stream', name: 'Andy', tracks: 2 },
      });
      this.log('Producer Created', result);

      const turnConfig = await this.guestCamService.getTurnConfig();

      result['iceServers'] = [turnConfig];

      this.makeObsRequest('func_send_transport_response', result);

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

      this.connected = true;
      this.unlockMutex();
    });
  }

  destroy() {
    super.destroy();
    // TODO: What does teardown for a producer look like?
  }
}
