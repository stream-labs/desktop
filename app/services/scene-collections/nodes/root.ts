import { Node } from './node';
import { SourcesNode } from './sources';
import { ScenesNode } from './scenes';
import { TransitionsNode } from './transitions';
import { HotkeysNode } from './hotkeys';
import { Inject } from 'services/core';
import { VideoService } from 'services/video';
import { StreamingService } from 'services/streaming';
import { OS } from 'util/operating-systems';
import { GuestCamNode } from './guest-cam';
import { VideoSettingsService } from 'services/settings-v2/video';
import { SettingsService } from 'services/settings';

interface ISchema {
  baseResolution: {
    width: number;
    height: number;
  };
  selectiveRecording?: boolean;
  sources: SourcesNode;
  scenes: ScenesNode;
  hotkeys?: HotkeysNode;
  transitions?: TransitionsNode; // V2 Transitions

  guestCam?: GuestCamNode;

  operatingSystem?: OS;
}

// This is the root node of the config file
export class RootNode extends Node<ISchema, {}> {
  schemaVersion = 3;

  @Inject() videoService: VideoService;
  @Inject() streamingService: StreamingService;
  @Inject() videoSettingsService: VideoSettingsService;
  @Inject() settingsService: SettingsService;

  async save(): Promise<void> {
    const sources = new SourcesNode();
    const scenes = new ScenesNode();
    const transitions = new TransitionsNode();
    const hotkeys = new HotkeysNode();
    const guestCam = new GuestCamNode();

    await sources.save({});
    await scenes.save({});
    await transitions.save();
    await hotkeys.save({});
    await guestCam.save();

    this.data = {
      sources,
      scenes,
      transitions,
      hotkeys,
      guestCam,
      baseResolution: this.videoService.baseResolution,
      selectiveRecording: this.streamingService.state.selectiveRecording,
      operatingSystem: process.platform as OS,
    };
  }

  async load(): Promise<void> {
    this.videoService.setBaseResolution(this.data.baseResolution);
    this.streamingService.setSelectiveRecording(!!this.data.selectiveRecording);

    await this.data.transitions.load();
    await this.data.sources.load({});
    await this.data.scenes.load({});

    if (this.data.hotkeys) {
      await this.data.hotkeys.load({});
    }

    if (this.data.guestCam) {
      await this.data.guestCam.load();
    }
  }

  migrate(version: number) {
    // Changed name of transition node in version 2
    if (version < 2) {
      this.data.transitions = this.data['transition'];
    }

    // Added baseResolution in version 3
    if (version < 3) {
      this.data.baseResolution = this.videoService.baseResolution;
    }
  }
}
