import { Button } from 'antd';
import { useVuex } from 'components-react/hooks';
import { Services } from 'components-react/service-provider';
import { ListInput, TextInput } from 'components-react/shared/inputs';
import Form from 'components-react/shared/inputs/Form';
import { ModalLayout } from 'components-react/shared/ModalLayout';
import React, { useMemo } from 'react';
import { EDeviceType } from 'services/hardware';
import { $t } from 'services/i18n';

export default function GuestCamProperties() {
  const { GuestCamService, HardwareService } = Services;
  const { status, videoDevice, videoDevices, audioDevice, audioDevices, inviteHash } = useVuex(
    () => ({
      status: GuestCamService.state.status,
      videoDevice: GuestCamService.views.videoDevice,
      audioDevice: GuestCamService.views.audioDevice,
      videoDevices: HardwareService.state.dshowDevices.map(d => ({
        label: d.description,
        value: d.id,
      })),
      audioDevices: HardwareService.state.devices
        .filter(d => d.type === EDeviceType.audioInput)
        .map(d => ({ label: d.description, value: d.id })),
      inviteHash: GuestCamService.state.inviteHash,
    }),
  );

  const videoSourceExists = !!useMemo(() => GuestCamService.views.findVideoSource(), [videoDevice]);
  const audioSourceExists = !!useMemo(() => GuestCamService.views.findAudioSource(), [audioDevice]);

  return (
    <ModalLayout scrollable>
      <Form>
        <ListInput
          label={$t('Webcam')}
          options={videoDevices}
          value={videoDevice}
          onChange={d => GuestCamService.actions.setVideoDevice(d)}
        />
        <ListInput
          label={$t('Microphone')}
          options={audioDevices}
          value={audioDevice}
          onChange={d => GuestCamService.actions.setAudioDevice(d)}
        />
        <TextInput readOnly value={inviteHash} />
      </Form>
      {!videoSourceExists && (
        <div>
          {$t(
            'The selected webcam does not exist as a source in your current scene collection. Please add it as a source before starting Guest Cam',
          )}
        </div>
      )}
      {!audioSourceExists && (
        <div>
          {$t(
            'The selected microphone does not exist as a source in your current scene collection. Please add it as a source before starting Guest Cam',
          )}
        </div>
      )}
      <Button>Start</Button>
    </ModalLayout>
  );
}
