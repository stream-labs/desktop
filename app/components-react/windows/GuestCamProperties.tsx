import { ExclamationCircleOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import * as remote from '@electron/remote';
import { Alert, Button, Modal, Tabs, Tooltip } from 'antd';
import { useVuex } from 'components-react/hooks';
import { Spinner } from 'components-react/pages/Loader';
import { Services } from 'components-react/service-provider';
import Display from 'components-react/shared/Display';
import { ListInput, SliderInput, TextInput } from 'components-react/shared/inputs';
import Form from 'components-react/shared/inputs/Form';
import { ModalLayout } from 'components-react/shared/ModalLayout';
import React, { useMemo, useState } from 'react';
import { EDismissable } from 'services/dismissables';
import { EDeviceType } from 'services/hardware';
import { $t } from 'services/i18n';
import { SourcesService, TSourceType } from 'services/sources';
import { byOS, OS } from 'util/operating-systems';
import { IGuest, GuestCamService } from 'services/guest-cam';
import { inject, useModule } from 'slap';
import { AudioService, EditorCommandsService } from 'app-services';

class GuestCamModule {
  private GuestCamService = inject(GuestCamService);
  private SourcesService = inject(SourcesService);
  private AudioService = inject(AudioService);
  private EditorCommandsService = inject(EditorCommandsService);

  get produceOk() {
    return this.GuestCamService.state.produceOk;
  }

  get videoProducerSourceId() {
    return this.GuestCamService.views.videoSourceId;
  }

  get audioProducerSourceId() {
    return this.GuestCamService.views.audioSourceId;
  }

  get videoProducerSourceOptions() {
    const videoSourceType = byOS({ [OS.Windows]: 'dshow_input', [OS.Mac]: 'av_capture_input' });

    return this.SourcesService.views.getSourcesByType(videoSourceType as TSourceType).map(s => ({
      label: s.name,
      value: s.sourceId,
    }));
  }

  get audioProducerSourceOptions() {
    const audioSourceType = byOS({
      [OS.Windows]: 'wasapi_input_capture',
      [OS.Mac]: 'coreaudio_input_capture',
    });

    return this.SourcesService.views.getSourcesByType(audioSourceType as TSourceType).map(s => ({
      label: s.name,
      value: s.sourceId,
    }));
  }

  get videoProducerSource() {
    return this.GuestCamService.views.videoSource;
  }

  get audioProducerSource() {
    return this.GuestCamService.views.audioSource;
  }

  get guests() {
    // TODO: Talk to Alex about this. Because reactivity is done via shallow
    // comparison, this won't be reactive unless it's a new array every time.
    // This seems fairly unexpected.
    return [...this.GuestCamService.state.guests];
  }

  /**
   * Fetches data needed to display a guest and functions needed to modify state
   * @param streamId The streamId of the guest
   */
  getBindingsForGuest(streamId: string) {
    const guest = this.GuestCamService.views.getGuestByStreamId(streamId);
    if (!guest?.sourceId) return;

    const source = this.SourcesService.views.getSource(guest.sourceId);
    if (!source) return;

    const volume = this.AudioService.views.getSource(source.sourceId).fader.deflection;
    const setVolume = (val: number) => {
      this.EditorCommandsService.actions.executeCommand(
        'SetDeflectionCommand',
        source.sourceId,
        val,
      );
    };

    const visible = !source.forceHidden;
    const setVisible = () => {
      this.GuestCamService.actions.setVisibility(source.sourceId, !visible);
    };

    const disconnect = () => {
      this.GuestCamService.actions.disconnectGuest(streamId, true);
    };

    const sourceId = source.sourceId;

    return {
      volume,
      setVolume,
      visible,
      setVisible,
      disconnect,
      sourceId,
    };
  }
}

export default function GuestCamProperties() {
  const {
    GuestCamService,
    SourcesService,
    WindowsService,
    EditorCommandsService,
    DismissablesService,
  } = Services;
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
    volume,
    showFirstTimeModal,
    joinAsGuest,
    hostName,
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
    volume: GuestCamService.views.deflection,
    showFirstTimeModal: DismissablesService.views.shouldShow(EDismissable.GuestCamFirstTimeModal),
    joinAsGuest: !!GuestCamService.state.joinAsGuestHash,
    hostName: GuestCamService.state.hostName,
  }));
  const { guests } = useModule(GuestCamModule);
  const [regeneratingLink, setRegeneratingLink] = useState(false);
  const openedSourceId = useMemo(() => WindowsService.getChildWindowQueryParams().sourceId, []);

  async function regenerateLink() {
    setRegeneratingLink(true);
    await GuestCamService.actions.return
      .ensureInviteLink(true)
      .finally(() => setRegeneratingLink(false));
  }

  function getModalContent() {
    if (joinAsGuest) {
      return <JoinAsGuestModalContent />;
    } else if (showFirstTimeModal) {
      return <FirstTimeModalContent />;
    } else {
      return <EveryTimeModalContent />;
    }
  }

  return (
    <ModalLayout scrollable>
      <Tabs destroyInactiveTabPane={true} defaultActiveKey="guest-settings">
        <Tabs.TabPane tab={$t('Global Settings')} key="global-settings">
          <Form>
            <TextInput
              readOnly
              value={inviteUrl}
              label={$t('Invite URL')}
              style={{ width: '100%' }}
              addonAfter={
                <Tooltip trigger="click" title={$t('Copied!')}>
                  <Button onClick={() => remote.clipboard.writeText(inviteUrl)}>
                    {$t('Copy')}
                  </Button>
                </Tooltip>
              }
            />
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
            />
            <ListInput
              label={$t('Microphone Source')}
              options={audioSources}
              value={audioSourceId}
              onChange={s => GuestCamService.actions.setAudioSource(s)}
            />
          </Form>
          {(!videoSourceExists || !audioSourceExists) && (
            <Alert
              type="error"
              showIcon={true}
              closable={false}
              message={
                <div style={{ color: 'var(--paragraph)' }}>
                  {!videoSourceExists && (
                    <div>
                      {$t('No webcam source is selected. Your guest will not be able to see you.')}
                    </div>
                  )}
                  {!audioSourceExists && (
                    <div>
                      {$t(
                        'No microphone source is selected. Your guest will not be able to hear you.',
                      )}
                    </div>
                  )}
                </div>
              }
            />
          )}
        </Tabs.TabPane>
        {guests.map((guest, index) => {
          return (
            <Tabs.TabPane
              tab={$t('Guest %{num} Settings', { num: index + 1 })}
              key={guest.remoteProducer.streamId}
            >
              <GuestPane guest={guest} />
            </Tabs.TabPane>
          );
        })}
      </Tabs>
      <Modal
        visible={!produceOk}
        getContainer={false}
        closable={false}
        okText={$t('Start Collab Cam')}
        onOk={() => {
          GuestCamService.actions.setProduceOk();
          DismissablesService.actions.dismiss(EDismissable.GuestCamFirstTimeModal);
        }}
        onCancel={() => WindowsService.actions.closeChildWindow()}
      >
        {getModalContent()}
      </Modal>
    </ModalLayout>
  );
}

function GuestPane(p: { guest: IGuest }) {
  const { getBindingsForGuest } = useModule(GuestCamModule);

  // TODO: Talk to Alex about how the useModule pattern thinks this should
  // be handled with reactivity. For now, wrap in useVuex to make it reactive.
  const bindings = useVuex(() => getBindingsForGuest(p.guest.remoteProducer.streamId));

  if (!bindings) {
    return <div>TODO: Guest is not assigned to a source</div>;
  }

  const { visible, setVisible, volume, setVolume, disconnect } = bindings;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--section-alt)',
        borderRadius: 8,
      }}
    >
      <div style={{ flexGrow: 1, padding: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'row' }}>
          <div style={{ flexGrow: 1 }}>
            {/* <div style={{ height: 32, margin: '10px 0 10px' }}>
              {joinAsGuest ? (
                <div>
                  <b>{$t('Connected To Host:')}</b>{' '}
                  <span style={{ color: 'var(--title)' }}>{hostName}</span>
                  <Tooltip
                    title={$t(
                      "You are connected as a guest using someone else's invite link. To leave, click the Disconnect button.",
                    )}
                  >
                    <QuestionCircleOutlined style={{ marginLeft: 6 }} />
                  </Tooltip>
                </div>
              ) : (
                <TextInput
                  readOnly
                  value={inviteUrl}
                  label={$t('Invite URL')}
                  style={{ width: '100%' }}
                />
              )}
            </div> */}
            <SliderInput
              label={$t('Volume')}
              value={volume}
              onChange={setVolume}
              min={0}
              max={1}
              debounce={500}
              step={0.01}
              tipFormatter={v => `${(v * 100).toFixed(0)}%`}
              style={{ width: '100%', margin: '20px 0' }}
            />
          </div>
          <div style={{ width: 350, marginLeft: 20 }}>
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                margin: '10px 0',
                height: 32,
              }}
            >
              {/* {joinAsGuest ? (
                <></>
              ) : (
                <>
                  <Tooltip title={$t('Copied!')} trigger="click">
                    <Button
                      onClick={() => remote.clipboard.writeText(inviteUrl)}
                      style={{ width: 160 }}
                    >
                      {$t('Copy Link')}
                    </Button>
                  </Tooltip>
                  <Button
                    disabled={regeneratingLink}
                    onClick={regenerateLink}
                    style={{ width: 160 }}
                  >
                    {$t('Generate a new link')}
                    {regeneratingLink && (
                      <i className="fa fa-spinner fa-pulse" style={{ marginLeft: 8 }} />
                    )}
                  </Button>
                </>
              )} */}
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                margin: '20px 0 0',
              }}
            >
              <Button
                onClick={setVisible}
                style={{ width: 160 }}
                type={!visible ? 'primary' : 'default'}
              >
                {visible ? $t('Hide on Stream') : $t('Show on Stream')}
              </Button>
              <button
                className="button button--soft-warning"
                style={{ width: 160 }}
                onClick={disconnect}
              >
                {$t('Disconnect')}
              </button>
            </div>
          </div>
        </div>
      </div>
      <GuestDisplay guest={p.guest} />
    </div>
  );
}

function GuestDisplay(p: { guest: IGuest }) {
  const { produceOk, getBindingsForGuest } = useModule(GuestCamModule);
  const { sourceId } = useVuex(() => getBindingsForGuest(p.guest.remoteProducer.streamId)!);

  return (
    <div style={{ background: 'var(--section)', borderRadius: '0 0 8px 8px', height: 280 }}>
      {/* Weird double div is to avoid display blocking border radius */}
      <div style={{ margin: '0 10px', width: 'calc(100% - 20px)', height: '100%' }}>
        {produceOk && <Display sourceId={sourceId} />}
      </div>
    </div>
  );
}

function EveryTimeModalContent() {
  return (
    <h2 style={{ textAlign: 'center' }}>
      {$t('Collab Cam is not yet sending your video and audio to guests. Start Collab Cam?')}
    </h2>
  );
}

function FirstTimeModalContent() {
  return (
    <>
      <h2>{$t('Welcome to Collab Cam')}</h2>
      <h3>{$t('Step 1')}</h3>
      <p>
        {$t(
          "Copy and share a link with your guest. When they join, they'll be able to see and hear you.",
        )}
      </p>
      <h3>{$t('Step 2')}</h3>
      <p>
        {$t(
          "Verify their identity in the preview area. When ready, add them to your stream by clicking 'Show on Stream'.",
        )}
      </p>
      <h3>{$t('Step 3')}</h3>
      <p>
        {$t(
          'Enjoy your stream! Adjust their volume, create new links, and change your mic and camera from the properties window.',
        )}
      </p>
      <Alert
        message={
          <div style={{ color: 'var(--info)' }}>
            <ExclamationCircleOutlined style={{ color: 'var(--info)', marginRight: 8 }} />
            {$t(
              "Don't share your invite link with anyone you don't want on your stream. You can invalidate an old link by generating a new one. Do not show this window on stream.",
            )}
          </div>
        }
        type="info"
        closable={false}
        showIcon={false}
        banner
      />
    </>
  );
}

function JoinAsGuestModalContent() {
  const { GuestCamService } = Services;
  const { hostName } = useVuex(() => ({ hostName: GuestCamService.state.hostName }));

  return (
    <>
      <h2>{$t("You're about to join %{name}", { name: hostName })}</h2>
      <p>
        {$t(
          "%{name} has invited you to join their stream. When you're ready to join, click the button below.",
          { name: hostName },
        )}
      </p>
    </>
  );
}
