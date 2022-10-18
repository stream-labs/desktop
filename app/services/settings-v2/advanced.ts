import { Inject, StatefulService } from 'services/core';
import * as obs from '../../../obs-api';
import { SettingsManagerService } from 'app-services';
import { VideoSettingsService } from './video';
import { $t } from 'services/i18n';

export class AdvancedSettingsService extends StatefulService<{}> {
  @Inject() videoSettingsService: VideoSettingsService;
  @Inject() settingsManagerService: SettingsManagerService;

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

  setVideoSetting(key: string, value: unknown) {
    this.videoSettingsService.setVideoSetting(key, value);
  }
}
