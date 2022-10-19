import { Inject, mutation, StatefulService, ViewHandler } from 'services/core';
import * as obs from '../../../obs-api';
import { SettingsManagerService } from 'services/settings-manager';
import { VideoSettingsService } from './video';
import { $t } from 'services/i18n';
import { OutputsService } from './output';

interface IAdvancedSettingsState {
  delay: obs.IDelay;
  reconnect: obs.IReconnect;
  network: obs.INetwork;
}
class AdvancedSettingsViews extends ViewHandler<IAdvancedSettingsState> {
  advancedSettingsValues(category: string) {
    return this.state[category];
  }

  get streamSettingsCategories() {
    return Object.keys(this.state);
  }
}

export class AdvancedSettingsService extends StatefulService<IAdvancedSettingsState> {
  @Inject() videoSettingsService: VideoSettingsService;
  @Inject() settingsManagerService: SettingsManagerService;
  @Inject() outputsService: OutputsService;

  initialState = {
    delay: {} as obs.IDelay,
    reconnect: {} as obs.IReconnect,
    network: {} as obs.INetwork,
  };

  obsFactories = {
    delay: null as obs.IDelay,
    reconnect: null as obs.IReconnect,
    network: null as obs.INetwork,
  };

  init() {
    this.establishState();
  }

  get views() {
    return new AdvancedSettingsViews(this.state);
  }

  get videoSettingsMetadata() {
    return {
      outputFormat: {
        type: 'list',
        label: $t('Color Format'),
        options: [
          { label: 'NV12', value: obs.EVideoFormat.NV12 },
          { label: 'I420', value: obs.EVideoFormat.I420 },
          { label: 'I444', value: obs.EVideoFormat.I444 },
          { label: 'RGB', value: obs.EVideoFormat.RGBA },
        ],
      },
      colorSpace: {
        type: 'list',
        label: $t('YUV Color Space'),
        options: [
          { label: '601', value: obs.EColorSpace.CS601 },
          { label: '709', value: obs.EColorSpace.CS709 },
        ],
      },
      range: {
        type: 'list',
        label: $t('YUV Color Range'),
        options: [
          { label: $t('Partial'), value: obs.ERangeType.Partial },
          { label: $t('Full'), value: obs.ERangeType.Full },
        ],
      },
    };
  }

  get delaySettingsMetadata() {
    return {
      enabled: { type: 'toggle', label: $t('Enabled') },
      delaySec: { type: 'number', label: $t('Duration (seconds)') },
      preserveDelay: {
        type: 'checkbox',
        label: $t('Preserve cutoff point (increase delay) when reconnecting'),
      },
    };
  }

  get reconnectSettingsMetadata() {
    return {
      enabled: { type: 'toggle', label: $t('Enabled') },
      retryDelay: { type: 'number', label: $t('Retry Delay (seconds') },
      maxRetries: { type: 'number', label: $t('Maximum Retries') },
    };
  }

  get networkSettingsMetadata() {
    return {
      bindIP: {
        type: 'list',
        label: $t('Bind to IP'),
        options: [{ label: $t('Default'), value: 'default' }],
      },
      enableDynamicBitrate: {
        type: 'checkbox',
        label: $t('Dynamically change bitrate when dropping frames while streaming'),
      },
      enableOptimizations: { type: 'checkbox', label: $t('Enable new networking code') },
      enableLowLatency: { type: 'checkbox', label: $t('Low latency mode') },
    };
  }

  get replaySettingsMetadata() {
    return {
      prefix: { type: 'text', label: $t('Replay Buffer Filename Prefix') },
      suffix: { type: 'text', label: $t('Replay Buffer Filename Suffix') },
    };
  }

  get recordingSettingsMetadata() {
    return {
      fileFormat: { type: 'text', label: $t('Filename Formatting') },
      overwrite: { type: 'checkbox', label: $t('Overwrite if file exists') },
    };
  }

  get sourcesSettingsMetadata() {
    return {
      browserAccel: {
        type: 'checkbox',
        label: $t('Enable Browser Source Hardware Acceleration (requires a restart)'),
      },
    };
  }

  get mediaSettingsMetadata() {
    return { caching: { type: 'checkbox', label: $t('Enable media file caching') } };
  }

  get generalSettingsMetadata() {
    return {
      processPriority: {
        type: 'list',
        label: $t('Process Priority'),
        options: [
          { label: $t('High'), value: obs.EProcessPriority.High },
          { label: $t('Above Normal'), value: obs.EProcessPriority.AboveNormal },
          { label: $t('Normal'), value: obs.EProcessPriority.Normal },
          { label: $t('Below Normal'), value: obs.EProcessPriority.BelowNormal },
          { label: $t('Idle'), value: obs.EProcessPriority.Idle },
        ],
      },
    };
  }

  get replaySettingsValues() {
    const replay = this.outputsService.outputs.replay;
    return { prefix: replay.prefix, suffix: replay.suffix };
  }

  get videoSettingsValues() {
    return this.videoSettingsService.advancedSettingsValues;
  }

  get recordingSettingsValues() {
    const recording = this.outputsService.outputs.recording;
    return { fileFormat: recording.fileFormat, overwrite: recording.overwrite };
  }

  get sourcesSettingsValues() {
    return { browserAccel: obs.NodeObs.GetBrowserAccelerationLegacy };
  }

  get mediaSettingsValues() {
    return { caching: obs.NodeObs.GetMediaFileCachingLegacy };
  }

  get generalSettingsValues() {
    return { processPriority: obs.NodeObs.GetProcessPriorityLegacy };
  }

  establishState() {
    this.buildFactories();
    this.migrateSettings();
    this.linkSettings();
  }

  migrateSettings() {
    this.views.streamSettingsCategories.forEach(category => {
      const setting = this.settingsManagerService.simpleStreamSettings[category];
      Object.keys(setting).forEach((key: string) => {
        this.setAdvancedSetting(category, key, setting[key]);
      });
    });
  }

  linkSettings() {
    this.views.streamSettingsCategories.forEach(category => {
      this.outputsService.outputs.stream[category] = this.obsFactories[category];
    });
  }

  buildFactories() {
    this.obsFactories.delay = obs.DelayFactory.create();
    this.obsFactories.reconnect = obs.ReconnectFactory.create();
    this.obsFactories.network = obs.NetworkFactory.create();
  }

  setVideoSetting(key: string, value: unknown) {
    this.videoSettingsService.setVideoSetting(key, value);
  }

  setAdvancedSetting(category: string, key: string, value: unknown) {
    this.obsFactories[category][key] = value;
    this.SET_ADVANCED_SETTING(category, key, value);
  }

  setMiscSetting(key: string, value: unknown) {
    if (key === 'browserAccel') {
      obs.NodeObs.SetBrowserAcceleration(value);
    } else if (key === 'caching') {
      obs.NodeObs.SetMediaFileCaching(value);
    } else if (key === 'processPriority') {
      obs.NodeObs.SetProcessPriority(value);
    }
  }

  @mutation()
  SET_ADVANCED_SETTING(category: string, key: string, value: unknown) {
    this.state[category][key] = value;
  }
}
