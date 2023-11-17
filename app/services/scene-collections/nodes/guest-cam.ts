import { GuestCamService } from 'app-services';
import { Inject } from 'services/core';
import { Node } from './node';

interface ISchema {
  audioSourceId: string;
  videoSourceId: string;
  screenshareSourceId?: string;
}

export class GuestCamNode extends Node<ISchema, {}> {
  schemaVersion = 1;

  @Inject() guestCamService: GuestCamService;

  async save() {
    this.data = {
      audioSourceId: this.guestCamService.state.audioSourceId,
      videoSourceId: this.guestCamService.state.videoSourceId,
    };
  }

  async load() {
    if (this.data.audioSourceId) this.guestCamService.setAudioSource(this.data.audioSourceId);
    if (this.data.videoSourceId) this.guestCamService.setVideoSource(this.data.videoSourceId);
  }
}
