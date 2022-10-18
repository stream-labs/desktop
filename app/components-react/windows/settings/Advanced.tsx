import React from 'react';
import { useModule } from 'slap';
import { Services } from '../../service-provider';
import FormFactory from 'components-react/shared/inputs/FormFactory';
import styles from './Common.m.less';
import { $t } from 'services/i18n';

class AdvancedSettingsModule {
  service = Services.AdvancedSettingsService;

  get videoValues() {
    return this.service.videoSettingsValues;
  }

  get videoMetadata() {
    return this.service.videoSettingsMetadata;
  }

  onVideoChange(key: string) {
    return (val: unknown) => this.service.actions.setVideoSetting(key, val);
  }
}

export function AdvancedSettings() {
  const { videoValues, videoMetadata, onVideoChange } = useModule(AdvancedSettingsModule);

  return (
    <div className={styles.formSection}>
      <h2>{$t('Video')}</h2>
      <FormFactory
        values={videoValues}
        metadata={videoMetadata}
        onChange={onVideoChange}
        formOptions={{ layout: 'vertical' }}
      />
    </div>
  );
}

AdvancedSettings.page = 'Advanced';
