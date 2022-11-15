import { Inject, mutation, StatefulService, ViewHandler, InitAfter } from 'services/core';
import * as obs from '../../../obs-api';
import { SettingsManagerService } from 'services/settings-manager';
import { VideoSettingsService } from './video';
import { OutputsService } from './output';

interface IAdvancedSettingsState {
  delay: obs.IDelay;
  reconnect: obs.IReconnect;
  network: obs.INetwork;
  misc: IMiscSettings;
}

interface IMiscSettings {
  processPriority: obs.EProcessPriority;
  browserAccel: boolean;
  caching: boolean;
}

// Inform which attributes are required due to API constraints
const OBS_ATTRIBUTES = {
  delay: ['enabled', 'delaySec', 'preserveDelay'],
  reconnect: ['enabled', 'retryDelay', 'maxRetries'],
  network: [
    'bindIP',
    'enableDynamicBitrate',
    'enableOptimizations',
    'enableLowLatency',
    'networkInterfaces',
  ],
};

class AdvancedSettingsViews extends ViewHandler<IAdvancedSettingsState> {
  advancedSettingsValues(category: string) {
    return this.state[category];
  }

  get streamSettingsCategories() {
    return Object.keys(OBS_ATTRIBUTES);
  }
}

@InitAfter('OutputsService')
export class AdvancedSettingsService extends StatefulService<IAdvancedSettingsState> {
  @Inject() videoSettingsService: VideoSettingsService;
  @Inject() settingsManagerService: SettingsManagerService;
  @Inject() outputsService: OutputsService;

  static initialState: IAdvancedSettingsState = {
    delay: {} as obs.IDelay,
    reconnect: {} as obs.IReconnect,
    network: {} as obs.INetwork,
    misc: {} as IMiscSettings,
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

  get sourcesSettingsValues() {
    return { browserAccel: this.state.misc.browserAccel };
  }

  get mediaSettingsValues() {
    return { caching: this.state.misc.caching };
  }

  get generalSettingsValues() {
    return { processPriority: this.state.misc.processPriority };
  }

  establishState() {
    this.buildFactories();
    this.migrateSettings();
  }

  migrateSettings() {
    Object.keys(OBS_ATTRIBUTES).forEach(category => {
      const setting = obs.AdvancedStreamingFactory.legacySettings[category];
      OBS_ATTRIBUTES[category].forEach((key: string) => {
        if (key === 'networkInterfaces') return;
        this.setAdvancedSetting(category, key, setting[key]);
      });
    });

    const miscSettings = this.settingsManagerService.miscSettings;
    Object.keys(miscSettings).forEach((key: string) => {
      this.SET_ADVANCED_SETTING('misc', key, miscSettings[key]);
    });
  }

  linkSettings() {
    this.views.streamSettingsCategories.forEach(category => {
      Object.keys(this.obsFactories[category]).forEach(property => {
        if (property === 'networkInterfaces') return;
        this.outputsService.outputs.stream[category][property] = this.obsFactories[category][
          property
        ];
      });
    });
  }

  buildFactories() {
    this.obsFactories.delay = obs.DelayFactory.create();
    this.obsFactories.reconnect = obs.ReconnectFactory.create();
    this.obsFactories.network = obs.NetworkFactory.create();
  }

  getInterfaceOptions() {
    const interfaces = obs.AdvancedStreamingFactory.legacySettings.network.networkInterfaces;
    return Object.keys(interfaces).map(key => ({ label: key, value: interfaces[key] }));
  }

  setAdvancedSetting(category: string, key: string, value: unknown) {
    this.SET_ADVANCED_SETTING(category, key, value);
    this.obsFactories[category] = this.state[category];
    this.outputsService.outputs.stream[category][key] = value;
  }

  setMiscSetting(key: string, value: unknown) {
    this.SET_ADVANCED_SETTING('misc', key, value);
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
