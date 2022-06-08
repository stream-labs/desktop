import { Button, Tabs, Tooltip } from 'antd';
import { useVuex } from 'components-react/hooks';
import { Services } from 'components-react/service-provider';
import Display from 'components-react/shared/Display';
import { ListInput, TextInput } from 'components-react/shared/inputs';
import Form from 'components-react/shared/inputs/Form';
import { ModalLayout } from 'components-react/shared/ModalLayout';
import React, { useMemo } from 'react';
import { EGuestCamStatus } from 'services/guest-cam';
import { EDeviceType } from 'services/hardware';
import { $t } from 'services/i18n';
import * as remote from '@electron/remote';
import { Spinner } from 'components-react/pages/Loader';

export default function GuestCamProperties() {
  const { GuestCamService, HardwareService } = Services;
  const {
    status,
    videoDevice,
    videoDevices,
    audioDevice,
    audioDevices,
    inviteUrl,
    source,
    guestInfo,
  } = useVuex(() => ({
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
    inviteUrl: GuestCamService.views.inviteUrl,
    source: GuestCamService.views.source,
    guestInfo: GuestCamService.state.guestInfo,
  }));

  const videoSourceExists = !!useMemo(() => GuestCamService.views.findVideoSource(), [videoDevice]);
  const audioSourceExists = !!useMemo(() => GuestCamService.views.findAudioSource(), [audioDevice]);

  function onProduceClick() {
    if (status === EGuestCamStatus.Busy) return;
    if (status === EGuestCamStatus.Offline) GuestCamService.actions.startProducing();
    if (status === EGuestCamStatus.Connected) GuestCamService.actions.stopProducing();
  }

  return (
    <ModalLayout scrollable>
      <Tabs destroyInactiveTabPane={true}>
        <Tabs.TabPane tab={$t('Guest Settings')} key="guest-settings">
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              height: 250,
              background: 'var(--section-alt)',
              borderRadius: 8,
            }}
          >
            <div style={{ flexGrow: 1, padding: 20 }}>
              <h3>{$t('Source: %{sourceName}', { sourceName: source?.name })}</h3>
              <Form layout="vertical">
                <TextInput
                  readOnly
                  value={inviteUrl}
                  label={$t('Invite URL')}
                  addonAfter={
                    <Tooltip title={$t('Copied!')} trigger="click">
                      <Button onClick={() => remote.clipboard.writeText(inviteUrl)}>
                        {$t('Copy')}
                      </Button>
                    </Tooltip>
                  }
                />
              </Form>
            </div>
            <div style={{ width: 300, background: 'var(--section)', borderRadius: '0 8px 8px 0' }}>
              {/* Weird double div is to avoid display blocking border radius */}
              <div style={{ margin: '10px 0', height: 'calc(100% - 20px)' }}>
                {!!guestInfo && <Display sourceId={source?.sourceId} />}
                {!guestInfo && (
                  <div
                    style={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      padding: '50px 0',
                    }}
                  >
                    <Spinner />
                    <div style={{ textAlign: 'center' }}>{$t('Waiting for guest to join')}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Tabs.TabPane>
        <Tabs.TabPane tab={$t('Global Settings')} key="global-settings">
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
          <Button disabled={status === EGuestCamStatus.Busy} onClick={onProduceClick}>
            {status === EGuestCamStatus.Connected ? 'Stop' : 'Start'}
          </Button>
        </Tabs.TabPane>
      </Tabs>
    </ModalLayout>
  );
}
