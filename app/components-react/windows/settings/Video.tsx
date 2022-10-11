import React from 'react';
import { useModule } from 'slap';
import { Services } from '../../service-provider';
import FormFactory from 'components-react/shared/inputs/FormFactory';
import styles from './Common.m.less';

class VideoSettingsModule {
  service = Services.VideoSettingsService;

  get values() {
    return this.service.videoSettingsValues;
  }

  get metadata() {
    return this.service.videoSettingsMetadata;
  }

  onChange(key: string) {
    return (val: unknown) => this.service.actions.setVideoSetting(key, val);
  }
}

export function VideoSettings() {
  const { values, metadata, onChange } = useModule(VideoSettingsModule);

  return (
    <div className={styles.formSection}>
      <FormFactory
        values={values}
        metadata={metadata}
        onChange={onChange}
        formOptions={{ layout: 'vertical' }}
      />
    </div>
  );
}

VideoSettings.page = 'Video';
