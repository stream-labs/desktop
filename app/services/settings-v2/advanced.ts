import { Inject, mutation, StatefulService, ViewHandler } from 'services/core';
import * as obs from '../../../obs-api';
import { SettingsManagerService } from 'services/settings-manager';
import { VideoSettingsService } from './video';
import { $t } from 'services/i18n';

interface IAdvancedSettingsState {
  delay: obs.IDelay;
}

class AdvancedSettingsViews extends ViewHandler<IAdvancedSettingsState> {
  advancedSettingsValues(category: string) {
    return this.state[category];
  }
}

export class AdvancedSettingsService extends StatefulService<IAdvancedSettingsState> {
  @Inject() videoSettingsService: VideoSettingsService;
  @Inject() settingsManagerService: SettingsManagerService;

  initialState = {
    delay: null as obs.IDelay,
  };

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

  get videoSettingsValues() {
    return this.videoSettingsService.advancedSettingsValues;
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

  setVideoSetting(key: string, value: unknown) {
    this.videoSettingsService.setVideoSetting(key, value);
  }

  setAdvancedSetting(category: string, key: string, value: unknown) {
    this.SET_ADVANCED_SETTING(category, key, value);
  }

  @mutation()
  SET_ADVANCED_SETTING(category: string, key: string, value: unknown) {
    this.state[category][key] = value;
  }
}
