import { MediasoupEntity } from './mediasoup-entity';
import uuid from 'uuid/v4';
import { Inject } from 'services/core';
import { SourceFiltersService, UserService } from 'app-services';
import { GuestCamService } from '.';
import { EFilterDisplayType } from 'services/source-filters';

export class Producer extends MediasoupEntity {
  @Inject() userService: UserService;
  @Inject() guestCamService: GuestCamService;
  @Inject() sourceFiltersService: SourceFiltersService;

  connected = false;

  streamId: string;
  transportId: string;

  async connect() {
    return this.withMutex(async () => {
      this.streamId = uuid();
      const result = await this.sendWebRTCRequest({
        type: 'createProducer',
        data: {
          streamId: this.streamId,
          type: 'stream',
          name: this.userService.views.platform.username,
          tracks: 2,
        },
      });
      this.log('Producer Created', result);

      const webcamSourceId = this.guestCamService.views.videoSourceId;
      const videoFilter = this.sourceFiltersService.views
        .filtersBySourceId(webcamSourceId, true)
        .find(f => f.type === 'mediasoupconnector_vfilter');
      this.sourceFiltersService.setSettings(webcamSourceId, videoFilter.name, {
        producerId: this.streamId,
      });

      const micSourceId = this.guestCamService.views.audioSourceId;
      const micFilter = this.sourceFiltersService.views
        .filtersBySourceId(micSourceId, true)
        .find(f => f.type === 'mediasoupconnector_afilter');
      this.sourceFiltersService.setSettings(micSourceId, micFilter.name, {
        producerId: this.streamId,
      });

      const turnConfig = await this.guestCamService.getTurnConfig();

      result['iceServers'] = [turnConfig];

      this.makeObsRequest('func_create_send_transport', result);

      const connectParams = this.makeObsRequest('func_create_audio_producer', { id: this.streamId })
        .connect_params;

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
          streamId: this.streamId,
          producerTransportId: audioProduceParams.transportId,
          kind: audioProduceParams.kind,
          rtpParameters: audioProduceParams.rtpParameters,
        },
      });

      this.transportId = audioProduceParams.transportId;

      // Always true - it's unclear what failure looks like from server
      this.makeObsRequest('func_produce_result', 'true');

      this.log('Got Server Add Audio Track Result', audioProduceResult);

      const videoProduceParams = this.makeObsRequest('func_create_video_producer', {
        id: this.streamId,
      }).produce_params;

      this.log('Got Video Produce Params', videoProduceParams);

      const videoProduceResult = await this.sendWebRTCRequest({
        type: 'addProducerTrack',
        data: {
          streamId: this.streamId,
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

  async addScreenShare(sourceId: string) {
    const streamId = uuid();
    const result = await this.sendWebRTCRequest({
      type: 'createProducer',
      data: {
        streamId,
        type: 'screenshare',
        name: this.userService.views.platform.username,
        tracks: 1,
      },
    });
    this.log('Producer Created', result);

    this.sourceFiltersService.views.filtersBySourceId(sourceId).forEach(filter => {
      if (filter.type === 'mediasoupconnector_vsfilter') {
        this.sourceFiltersService.remove(sourceId, filter.name);
      }
    });
    this.sourceFiltersService.add(
      sourceId,
      'mediasoupconnector_vsfilter',
      uuid(),
      {
        room: this.guestCamService.room,
        producerId: streamId,
      },
      EFilterDisplayType.Hidden,
    );

    const videoProduceParams = this.makeObsRequest('func_create_video_producer', {
      id: streamId,
    }).produce_params;

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
  }

  destroy() {
    this.makeObsRequest('func_stop_sender', '');
    if (this.streamId && this.transportId) {
      this.sendWebRTCRequest({
        type: 'closeProducerTrack',
        data: { streamId: this.streamId, producerTransportId: this.transportId },
      });
    }
    super.destroy();
  }
}
