import { Alert, Button, Modal, Tabs, Tooltip } from 'antd';
import { useVuex } from 'components-react/hooks';
import { Services } from 'components-react/service-provider';
import Display from 'components-react/shared/Display';
import { ListInput, TextInput } from 'components-react/shared/inputs';
import Form from 'components-react/shared/inputs/Form';
import { ModalLayout } from 'components-react/shared/ModalLayout';
import React, { useMemo, useState } from 'react';
import { EDeviceType } from 'services/hardware';
import { $t } from 'services/i18n';
import * as remote from '@electron/remote';
import { Spinner } from 'components-react/pages/Loader';

export default function GuestCamProperties() {
  const { GuestCamService, HardwareService } = Services;
  const {
    produceOk,
    visible,
    videoDevice,
    videoDevices,
    audioDevice,
    audioDevices,
    inviteUrl,
    source,
    guestInfo,
  } = useVuex(() => ({
    produceOk: GuestCamService.state.produceOk,
    visible: GuestCamService.views.guestVisible,
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
  const [regeneratingLink, setRegeneratingLink] = useState(false);

  const videoSourceExists = !!useMemo(() => GuestCamService.views.findVideoSource(), [videoDevice]);
  const audioSourceExists = !!useMemo(() => GuestCamService.views.findAudioSource(), [audioDevice]);

  async function regenerateLink() {
    setRegeneratingLink(true);
    await GuestCamService.actions.return
      .ensureInviteLink(true)
      .finally(() => setRegeneratingLink(false));
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
              <Button onClick={() => GuestCamService.actions.setVisibility(!visible)}>
                {visible ? $t('Hide') : $t('Show')}
              </Button>
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
              <Button disabled={regeneratingLink} onClick={regenerateLink}>
                {$t('Generate a new link')}
                {regeneratingLink && (
                  <i className="fa fa-spinner fa-pulse" style={{ marginLeft: 8 }} />
                )}
              </Button>
            </div>
            <div style={{ width: 300, background: 'var(--section)', borderRadius: '0 8px 8px 0' }}>
              {/* Weird double div is to avoid display blocking border radius */}
              <div style={{ margin: '10px 0', height: 'calc(100% - 20px)' }}>
                {!!guestInfo && produceOk && <Display sourceId={source?.sourceId} />}
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
        </Tabs.TabPane>
      </Tabs>
      <Modal footer={null} visible={!produceOk} getContainer={false}>
        <h2>{$t('Initialize Guest Cam?')}</h2>
        <p>
          {$t(
            'Guest Cam is currently listening for connecting guests, but is not broadcasting your microphone and webcam to your guests yet.',
          )}
        </p>
        <Alert
          message={
            <div style={{ color: 'var(--paragraph)' }}>
              <p>{$t('Please consider the following before starting Guest Cam')}</p>
              <ul>
                <li>
                  {$t(
                    'Once you start Guest Cam, people joining your invite link will be able to see and hear you',
                  )}
                </li>
                <li>
                  {$t('Guests will not be visible on your stream until you unhide them from here')}
                </li>
                <li>{$t('Do not share your invite link with anyone you do not wish to invite')}</li>
                <li>
                  {$t(
                    'You can always generate a new link from this window, which will invalidate old links',
                  )}
                </li>
                <li>{$t('Do not show this window on stream')}</li>
              </ul>
            </div>
          }
          type="info"
          closable={false}
          showIcon={false}
          banner
        />
        <Button
          type="primary"
          style={{ marginTop: 24 }}
          onClick={() => GuestCamService.actions.setProduceOk()}
        >
          {$t('Start Guest Cam')}
        </Button>
      </Modal>
    </ModalLayout>
  );
}
