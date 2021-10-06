import React from 'react';
import { ModalLayout } from 'components-react/shared/ModalLayout';
import { $t } from 'services/i18n';
import Form from 'components-react/shared/inputs/Form';
import { CheckboxInput, NumberInput } from 'components-react/shared/inputs';
import { Services } from 'components-react/service-provider';
import { useVuex } from 'components-react/hooks';
import { Button, message } from 'antd';

export default function SafeMode() {
  const { RecentEventsService, WindowsService } = Services;
  const v = useVuex(() => RecentEventsService.state.safeMode);

  function safeModeForm() {
    return (
      <>
        <h1>{$t('Activate Safe Mode?')}</h1>
        <h2>
          {$t(
            'Safe Mode prevents malicious users from sending harassment, hateful messages, and chat spam.',
          )}
        </h2>
        <Form layout="vertical">
          <div className="section">
            <p>Activating Safe Mode will:</p>
            <CheckboxInput
              label={$t('Clear all recent events')}
              value={v.clearRecentEvents}
              onChange={val =>
                RecentEventsService.actions.setSafeModeSettings({ clearRecentEvents: val })
              }
            />
            <CheckboxInput
              label={$t('Clear currently queued follower/host/raid alerts')}
              value={v.clearQueuedAlerts}
              onChange={val =>
                RecentEventsService.actions.setSafeModeSettings({ clearQueuedAlerts: val })
              }
            />
            <CheckboxInput
              label={$t('Disable follower alerts')}
              value={v.disableFollowerAlerts}
              onChange={val =>
                RecentEventsService.actions.setSafeModeSettings({ disableFollowerAlerts: val })
              }
            />
          </div>
          <div className="section">
            <p style={{ color: 'var(--red)' }}>
              These options will only take effect if Cloudbot is running
            </p>
            <CheckboxInput
              label={$t('Put chat in emote-only mode')}
              value={v.emoteOnly}
              onChange={val => RecentEventsService.actions.setSafeModeSettings({ emoteOnly: val })}
            />
            <CheckboxInput
              label={$t('Put chat in follower-only mode')}
              value={v.followerOnly}
              onChange={val =>
                RecentEventsService.actions.setSafeModeSettings({ followerOnly: val })
              }
            />
            <CheckboxInput
              label={$t('Put chat in sub-only mode')}
              value={v.subOnly}
              onChange={val => RecentEventsService.actions.setSafeModeSettings({ subOnly: val })}
            />
            <CheckboxInput
              label={$t('Disable chat alerts for followers')}
              value={v.disableChatAlerts}
              onChange={val =>
                RecentEventsService.actions.setSafeModeSettings({ disableChatAlerts: val })
              }
            />
            <CheckboxInput
              label={$t('Clear chat history')}
              value={v.clearChat}
              onChange={val => RecentEventsService.actions.setSafeModeSettings({ clearChat: val })}
            />
          </div>
          <div className="section">
            <CheckboxInput
              label={$t('Automatically disable Safe Mode')}
              tooltip={$t(
                'Safe Mode will automatically be disabled after this many minutes, or until you click the button again.',
              )}
              value={v.enableTimer}
              onChange={val =>
                RecentEventsService.actions.setSafeModeSettings({ enableTimer: val })
              }
            />
            {v.enableTimer && (
              <div style={{ marginTop: 8 }}>
                <span style={{ marginRight: 8 }}>{$t('Disable after')}</span>
                <NumberInput
                  value={v.timeInMinutes}
                  onInput={val =>
                    RecentEventsService.actions.setSafeModeSettings({ timeInMinutes: val })
                  }
                  min={1}
                  max={200}
                  uncontrolled
                  nowrap
                />
                <span style={{ marginLeft: 8 }}>{$t('minutes')}</span>
              </div>
            )}
          </div>
        </Form>
      </>
    );
  }

  function safeModeEnabled() {
    return (
      <div style={{ textAlign: 'center', marginTop: 60 }}>
        <h1>{$t('Safe Mode is Enabled')}</h1>
        <div>
          <i
            className="fa fa-shield-alt"
            style={{ color: 'var(--teal)', fontSize: 200, marginTop: 30, marginBottom: 30 }}
          />
        </div>
        <Button
          type="primary"
          danger
          disabled={v.loading}
          onClick={() => {
            RecentEventsService.actions.return
              .disableSafeMode()
              .then(() => WindowsService.actions.closeChildWindow())
              .catch(() => message.error($t('Something went wrong disabling Safe Mode'), 5));
          }}
        >
          {v.loading && <i className="fa fa-pulse fa-spinner" style={{ marginRight: 8 }} />}
          {$t('Disable Safe Mode')}
        </Button>
      </div>
    );
  }

  let onOk;

  if (!v.enabled) {
    onOk = () => {
      RecentEventsService.actions.return
        .activateSafeMode()
        .then(() => WindowsService.actions.closeChildWindow())
        .catch(() => message.error($t('Something went wrong enabling Safe Mode'), 5));
    };
  }

  return (
    <ModalLayout okText={$t('Activate')} onOk={onOk} confirmLoading={v.loading}>
      {v.enabled && safeModeEnabled()}
      {!v.enabled && safeModeForm()}
    </ModalLayout>
  );
}
