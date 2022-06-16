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
import { byOS, OS } from 'util/operating-systems';
import { TSourceType } from 'services/sources';

export default function GuestCamProperties() {
  const { GuestCamService, SourcesService } = Services;
  const audioSourceType = byOS({
    [OS.Windows]: 'wasapi_input_capture',
    [OS.Mac]: 'coreaudio_input_capture',
  });
  const videoSourceType = byOS({ [OS.Windows]: 'dshow_input', [OS.Mac]: 'av_capture_input' });
  const {
    produceOk,
    visible,
    videoSourceId,
    audioSourceId,
    videoSources,
    audioSources,
    videoSourceExists,
    audioSourceExists,
    inviteUrl,
    source,
    guestInfo,
  } = useVuex(() => ({
    produceOk: GuestCamService.state.produceOk,
    visible: GuestCamService.views.guestVisible,
    videoSourceId: GuestCamService.views.videoSourceId,
    videoSources: SourcesService.views.getSourcesByType(videoSourceType as TSourceType).map(s => ({
      label: s.name,
      value: s.sourceId,
    })),
    videoSourceExists: !!GuestCamService.views.videoSource,
    audioSourceId: GuestCamService.views.audioSourceId,
    audioSources: SourcesService.views.getSourcesByType(audioSourceType as TSourceType).map(s => ({
      label: s.name,
      value: s.sourceId,
    })),
    audioSourceExists: !!GuestCamService.views.audioSource,
    inviteUrl: GuestCamService.views.inviteUrl,
    source: GuestCamService.views.source,
    guestInfo: GuestCamService.state.guestInfo,
  }));
  const [regeneratingLink, setRegeneratingLink] = useState(false);

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
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <Button
                  onClick={() => GuestCamService.actions.setVisibility(!visible)}
                  disabled={!guestInfo}
                  style={{ width: '45%' }}
                  type={!!guestInfo && !visible ? 'primary' : 'default'}
                >
                  {!!guestInfo && visible ? $t('Hide on Stream') : $t('Show on Stream')}
                </Button>
                <button
                  className="button button--soft-warning"
                  style={{ width: '45%' }}
                  disabled={!guestInfo}
                  onClick={() => GuestCamService.actions.disconnectGuest()}
                >
                  {$t('Disconnect')}
                </button>
              </div>
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
            <h2>
              {$t(
                'You will need to select a microphone and webcam source in your current scene collection that will be sent to your guests for them to see and hear you.',
              )}
            </h2>
            <ListInput
              label={$t('Webcam Source')}
              options={videoSources}
              value={videoSourceId}
              onChange={s => GuestCamService.actions.setVideoSource(s)}
              allowClear={true}
            />
            <ListInput
              label={$t('Microphone Source')}
              options={audioSources}
              value={audioSourceId}
              onChange={s => GuestCamService.actions.setAudioSource(s)}
              allowClear={true}
            />
          </Form>
          {!videoSourceExists && (
            <div>{$t('No webcam source is selected. Your guest will not be able to see you.')}</div>
          )}
          {!audioSourceExists && (
            <div>
              {$t('No microphone source is selected. Your guest will not be able to hear you.')}
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
