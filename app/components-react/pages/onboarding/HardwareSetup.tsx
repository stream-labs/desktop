import React, { useEffect, useRef } from 'react';
import { $t } from 'services/i18n';
import commonStyles from './Common.m.less';
import styles from './HardwareSetup.m.less';
import { Services } from 'components-react/service-provider';
import Display from 'components-react/shared/Display';
import { ERenderingMode } from '../../../../obs-api';
import Form from 'components-react/shared/inputs/Form';
import { ListInput } from 'components-react/shared/inputs';
import { useVuex } from 'components-react/hooks';
import { Volmeter2d } from 'services/audio/volmeter-2d';

export function HardwareSetup() {
  const { DefaultHardwareService, SourceFiltersService } = Services;
  const v = useVuex(() => ({
    videoDevices: DefaultHardwareService.videoDevices.map(device => ({
      label: device.description,
      value: device.id,
    })),
    audioDevices: DefaultHardwareService.audioDevices.map(device => ({
      label: device.description,
      value: device.id,
    })),
    selectedVideoSource: DefaultHardwareService.selectedVideoSource,
    selectedVideoDevice: DefaultHardwareService.state.defaultVideoDevice,
    presetFilterValue: DefaultHardwareService.state.presetFilter,
    selectedAudioDevice: DefaultHardwareService.state.defaultAudioDevice,
    selectedAudioSource: DefaultHardwareService.selectedAudioSource,
  }));
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Set up volmeter
  useEffect(() => {
    if (canvasRef.current && v.selectedAudioSource) {
      const volmeter2d = new Volmeter2d(v.selectedAudioSource, canvasRef.current);

      return () => volmeter2d.destroy();
    }
  }, [canvasRef.current, v.selectedAudioSource]);

  // Set up temporary sources
  useEffect(() => {
    DefaultHardwareService.createTemporarySources();

    if (!DefaultHardwareService.selectedVideoSource && v.videoDevices.length) {
      DefaultHardwareService.actions.setDefault('video', v.videoDevices[0].value);
    }

    return () => DefaultHardwareService.actions.clearTemporarySources();
  }, []);

  function setVideoDevice(val: string) {
    const oldPresetValue = v.presetFilterValue;

    if (oldPresetValue) {
      setPresetFilter('');
    }

    // Needs to be sync
    DefaultHardwareService.setDefault('video', val);

    if (oldPresetValue) {
      setPresetFilter(oldPresetValue);
    }
  }

  function setPresetFilter(value: string) {
    if (!DefaultHardwareService.selectedVideoSource) return;

    DefaultHardwareService.actions.setPresetFilter(value);

    if (value === '') {
      SourceFiltersService.remove(DefaultHardwareService.selectedVideoSource.sourceId, '__PRESET');
    } else {
      SourceFiltersService.addPresetFilter(
        DefaultHardwareService.selectedVideoSource.sourceId,
        value,
      );
    }
  }

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <h1 className={commonStyles.titleContainer}>{$t('Set Up Mic and Webcam')}</h1>
      <div className={styles.contentContainer}>
        <DisplaySection />
        {!!v.videoDevices.length && (
          <Form layout="vertical">
            <ListInput
              label={$t('Webcam')}
              options={v.videoDevices}
              value={v.selectedVideoDevice}
              onChange={setVideoDevice}
              allowClear={false}
            />
            <ListInput
              label={$t('Visual Preset')}
              options={SourceFiltersService.views.presetFilterOptionsReact}
              value={v.presetFilterValue}
              onChange={setPresetFilter}
              allowClear={false}
            />
            <ListInput
              label={$t('Microphone')}
              options={v.audioDevices}
              value={v.selectedAudioDevice}
              onChange={val => DefaultHardwareService.actions.setDefault('audio', val)}
              allowClear={false}
            />
            <div className="section">
              <canvas ref={canvasRef} style={{ backgroundColor: 'var(--border)', width: '100%' }} />
            </div>
          </Form>
        )}
      </div>
    </div>
  );
}

function DisplaySection() {
  const { DefaultHardwareService } = Services;
  const v = useVuex(() => ({
    videoDevices: DefaultHardwareService.videoDevices,
    selectedVideoSource: DefaultHardwareService.selectedVideoSource,
  }));

  if (v.selectedVideoSource && v.videoDevices.length) {
    return (
      <div className={styles.display}>
        <Display
          sourceId={v.selectedVideoSource.sourceId}
          renderingMode={ERenderingMode.OBS_MAIN_RENDERING}
        />
      </div>
    );
  }

  return (
    <div className={styles.placeholder}>
      <span>{$t('No webcam detected')}</span>
    </div>
  );
}
