import { MediasoupEntity } from './mediasoup-entity';
import uuid from 'uuid/v4';
import { Inject } from 'services/core';
import { SourceFiltersService, SourcesService, UserService } from 'app-services';
import { GuestCamService, TConnectParams } from '.';
import { EFilterDisplayType, TSourceFilterType } from 'services/source-filters';

type TStreamType = 'camera' | 'screenshare';

interface IStream {
  id: string;
  type: TStreamType;
  videoSourceId: string;
  audioSourceId: string;
}

interface RtpEncodingParameters {
  maxBitrate: number;
  scaleResolutionDownBy: number;
}

export class Producer extends MediasoupEntity {
  @Inject() userService: UserService;
  @Inject() guestCamService: GuestCamService;
  @Inject() sourceFiltersService: SourceFiltersService;
  @Inject() sourcesService: SourcesService;

  transportId: string;

  streams: IStream[] = [];

  addStream(videoSourceId: string, type: TStreamType, audioSourceId?: string) {
    return this.withMutex(async () => {
      const videoSource = this.sourcesService.views.getSource(videoSourceId);

      if (!videoSource) {
        // TODO error handling
      }

      const streamId = uuid();
      this.streams.push({
        id: streamId,
        type,
        videoSourceId,
        audioSourceId,
      });

      // Start by setting up filters
      this.setupFiltersOnSource(videoSourceId, 'video', streamId);
      if (audioSourceId) this.setupFiltersOnSource(audioSourceId, 'audio', streamId);

      const result = await this.sendWebRTCRequest({
        type: 'createProducer',
        data: {
          streamId,
          type: type === 'camera' ? 'stream' : 'screenshare',
          name: this.userService.views.platform.username,
          tracks: audioSourceId ? 2 : 1,
        },
      });

      if (!this.transportId) {
        const turnConfig = await this.guestCamService.getTurnConfig();

        result['iceServers'] = [turnConfig];

        this.makeObsRequest('func_create_send_transport', result);
      }

      const encodings =
        type === 'camera'
          ? this.getCameraEncodingParameters(videoSource.height)
          : this.getScreenshareEncodingParameters(videoSource.height);

      const videoProduceResult = this.makeObsRequest('func_create_video_producer', {
        id: videoSourceId,
        encodings,
      });
      this.log('Got Video Produce Result', videoProduceResult);

      if (!this.transportId) {
        if (!videoProduceResult.connect_params) {
          throw new Error(
            'Did not receive connect params, yet send transport is not yet connected!',
          );
        }

        await this.sendWebRTCRequest({
          type: 'connectSendTransport',
          data: videoProduceResult.connect_params,
        });

        this.log('Connected Send Transport');

        videoProduceResult.produce_params = this.makeObsRequest(
          'func_connect_result',
          'true',
        ).produce_params;

        this.transportId = videoProduceResult.produce_params.transportId;
      }

      await this.sendWebRTCRequest({
        type: 'addProducerTrack',
        data: {
          streamId,
          producerTransportId: videoProduceResult.produce_params.transportId,
          kind: videoProduceResult.produce_params.kind,
          rtpParameters: videoProduceResult.produce_params.rtpParameters,
        },
      });

      this.makeObsRequest('func_produce_result', 'true');

      if (audioSourceId) {
        const audioProduceParams = this.makeObsRequest('func_create_audio_producer', {
          id: audioSourceId,
        }).produce_params;

        this.log('Got Audio Produce Params', audioProduceParams);

        await this.sendWebRTCRequest({
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
      }

      this.unlockMutex();
    });
  }

  setupFiltersOnSource(sourceId: string, type: 'audio' | 'video', streamId: string) {
    // Remove all mediasoup filters
    this.sourceFiltersService.views.filtersBySourceId(sourceId).forEach(filter => {
      if (
        [
          'mediasoupconnector_afilter',
          'mediasoupconnector_vfilter',
          'mediasoupconnector_vsfilter',
        ].includes(filter.type)
      ) {
        this.sourceFiltersService.remove(sourceId, filter.name);
      }
    });

    let filterType: TSourceFilterType = 'mediasoupconnector_afilter';
    const source = this.sourcesService.views.getSource(sourceId);

    if (!source) {
      this.log('Tried to set up filter on source that does not exist!');
      return;
    }

    if (type === 'video') {
      if (['dshow_input', 'av_capture_input'].includes(source.type)) {
        filterType = 'mediasoupconnector_vfilter';
      } else {
        filterType = 'mediasoupconnector_vsfilter';
      }
    }

    this.sourceFiltersService.add(
      sourceId,
      filterType,
      uuid(),
      { room: this.guestCamService.room, producerId: sourceId },
      EFilterDisplayType.Hidden,
    );
  }

  getCameraEncodingParameters(height: number): RtpEncodingParameters[] {
    if (height > 720) {
      return [
        { maxBitrate: 256000, scaleResolutionDownBy: 4 },
        { maxBitrate: 1200000, scaleResolutionDownBy: 2 },
        { maxBitrate: 2400000, scaleResolutionDownBy: 1 },
      ];
    }

    if (height > 480) {
      return [
        { maxBitrate: 256000, scaleResolutionDownBy: 4 },
        { maxBitrate: 512000, scaleResolutionDownBy: 2 },
        { maxBitrate: 1500000, scaleResolutionDownBy: 1 },
      ];
    }

    if (height > 360) {
      return [
        { maxBitrate: 300000, scaleResolutionDownBy: 2 },
        { maxBitrate: 600000, scaleResolutionDownBy: 1 },
        { maxBitrate: 600000, scaleResolutionDownBy: 1 },
      ];
    }

    return [
      { maxBitrate: 200000, scaleResolutionDownBy: 2 },
      { maxBitrate: 500000, scaleResolutionDownBy: 1 },
      { maxBitrate: 500000, scaleResolutionDownBy: 1 },
    ];
  }

  getScreenshareEncodingParameters(height: number): RtpEncodingParameters[] {
    if (height > 720) {
      return [{ maxBitrate: 2600000, scaleResolutionDownBy: 1 }];
    }

    if (height > 480) {
      return [{ maxBitrate: 2000000, scaleResolutionDownBy: 1 }];
    }

    if (height > 360) {
      return [{ maxBitrate: 1500000, scaleResolutionDownBy: 2 }];
    }

    return [{ maxBitrate: 1000000, scaleResolutionDownBy: 3 }];
  }

  destroy() {
    this.makeObsRequest('func_stop_sender');
    this.streams.forEach(stream => {
      this.makeObsRequest('func_stop_producer', stream.videoSourceId);
      if (stream.audioSourceId) this.makeObsRequest('func_stop_producer', stream.audioSourceId);
      this.sendWebRTCRequest({
        type: 'closeProducerTrack',
        data: { streamId: stream.id, producerTransportId: this.transportId },
      });
    });
    super.destroy();
  }
}
