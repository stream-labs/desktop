import React, { useEffect, useRef, useState } from 'react';
import { CheckCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';
import HotkeyBinding, { getBindingString } from 'components-react/shared/HotkeyBinding';
import { IHotkey } from 'services/hotkeys';
import { Services } from 'components-react/service-provider';
import { useVuex } from 'components-react/hooks';
import { Button } from 'antd';
import { SUPPORTED_FILE_TYPES } from 'services/highlighter/constants';
import { SliderInput } from 'components-react/shared/inputs';
import Form from 'components-react/shared/inputs/Form';
import Scrollable from 'components-react/shared/Scrollable';
import styles from '../pages/Highlighter.m.less';
import { $t } from 'services/i18n';
import Translate from 'components-react/shared/Translate';

export default function BlankSlate(p: { close: () => void }) {
  const { HotkeysService, SettingsService, StreamingService } = Services;
  const [hotkey, setHotkey] = useState<IHotkey | null>(null);
  const hotkeyRef = useRef<IHotkey | null>(null);
  const v = useVuex(() => ({
    settingsValues: SettingsService.views.values,
    isStreaming: StreamingService.isStreaming,
  }));

  const correctlyConfigured =
    v.settingsValues.Output.RecRB &&
    v.settingsValues.General.ReplayBufferWhileStreaming &&
    !v.settingsValues.General.KeepReplayBufferStreamStops &&
    SUPPORTED_FILE_TYPES.includes(v.settingsValues.Output.RecFormat);

  function configure() {
    SettingsService.actions.setSettingsPatch({
      General: {
        ReplayBufferWhileStreaming: true,
        KeepReplayBufferStreamStops: false,
      },
      Output: {
        RecRB: true,
      },
    });

    // We will only set recording format to mp4 if the user isn't already on
    // a supported format. i.e. don't switch them from mov to mp4, but we will
    // switch from flv to mp4.
    if (!SUPPORTED_FILE_TYPES.includes(v.settingsValues.Output.RecFormat)) {
      SettingsService.actions.setSettingsPatch({ Output: { RecFormat: 'mp4' } });
    }
  }

  useEffect(() => {
    HotkeysService.actions.return.getGeneralHotkeyByName('SAVE_REPLAY').then(hotkey => {
      if (hotkey) setHotkey(hotkey);
    });
  }, []);

  useEffect(() => {
    if (!v.isStreaming) {
      HotkeysService.actions.unregisterAll();

      return () => {
        if (hotkeyRef.current) {
          // Implies a bind all
          HotkeysService.actions.applyGeneralHotkey(hotkeyRef.current);
        } else {
          HotkeysService.actions.bindHotkeys();
        }
      };
    }
  }, [v.isStreaming]);

  function completedStepHeading(title: string) {
    return (
      <h3>
        <CheckCircleOutlined style={{ color: 'var(--teal)', fontSize: 24, marginRight: 8 }} />
        <span style={{ lineHeight: '24px', verticalAlign: 'top' }}>{title}</span>
      </h3>
    );
  }

  function incompleteStepHeading(title: string) {
    return (
      <h3>
        <InfoCircleOutlined style={{ color: 'var(--info)', fontSize: 24, marginRight: 8 }} />
        <span style={{ lineHeight: '24px', verticalAlign: 'top' }}>{title}</span>
      </h3>
    );
  }

  function setReplayTime(time: number) {
    SettingsService.actions.setSettingsPatch({ Output: { RecRBTime: time } });
  }

  return (
    <div className={styles.clipsViewRoot} style={{ width: '100%', display: 'flex' }}>
      <Scrollable style={{ padding: 24, width: '100%' }}>
        <h1>
          {$t('Highlighter')}{' '}
          <span style={{ fontSize: 12, verticalAlign: 'top', color: 'var(--beta-text)' }}>
            {$t('Beta')}
          </span>
        </h1>
        <p>
          {$t(
            'The highlighter allows you to clip the best moments from your livestream and edit them together into an exciting highlight video you can upload directly to YouTube.',
          )}
        </p>
        <div style={{ display: 'flex' }}>
          <div style={{ width: 600, flexShrink: 0 }}>
            <h2>{$t('Get Started')}</h2>
            {!v.isStreaming && (
              <div className="section">
                {correctlyConfigured
                  ? completedStepHeading($t('Configure the replay buffer'))
                  : incompleteStepHeading($t('Configure the replay buffer'))}
                {correctlyConfigured ? (
                  <div>{$t('The replay buffer is correctly configured')}</div>
                ) : (
                  <Button onClick={configure}>{$t('Configure')}</Button>
                )}
              </div>
            )}
            {!v.isStreaming && (
              <div className="section">
                {completedStepHeading($t('Adjust replay duration'))}
                <div>
                  {$t('Set the duration of captured replays. You can always trim them down later.')}
                </div>
                <Form layout="inline">
                  <SliderInput
                    style={{ width: 400, marginTop: 8 }}
                    label={$t('Replay Duration')}
                    value={v.settingsValues.Output.RecRBTime}
                    onChange={setReplayTime}
                    min={1}
                    max={120}
                    step={1}
                    debounce={200}
                    hasNumberInput={false}
                    tooltipPlacement="top"
                    tipFormatter={v => `${v}s`}
                  />
                </Form>
              </div>
            )}
            {!v.isStreaming && (
              <div className="section">
                {hotkey?.bindings.length
                  ? completedStepHeading($t('Set a hotkey to capture replays'))
                  : incompleteStepHeading($t('Set a hotkey to capture replays'))}
                {hotkey && (
                  <HotkeyBinding
                    hotkey={hotkey}
                    binding={hotkey.bindings[0] ?? null}
                    onBind={binding => {
                      const newHotkey = { ...hotkey };
                      newHotkey.bindings.splice(0, 1, binding);
                      setHotkey(newHotkey);
                      hotkeyRef.current = newHotkey;
                    }}
                  />
                )}
              </div>
            )}
            <div className="section">
              {incompleteStepHeading($t('Capture a replay'))}
              {!!hotkey?.bindings.length && (
                <div>
                  <Translate
                    message={$t('highlighterHotkeyInstructions', {
                      bindingStr: getBindingString(hotkey.bindings[0]),
                    })}
                  />
                </div>
              )}
              {!hotkey?.bindings.length && (
                <div>
                  {$t('Start streaming and capture a replay. Check back here after your stream.')}
                </div>
              )}
            </div>
            <a onClick={p.close}>{$t('Or, import a clip from your computer')}</a>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', paddingLeft: 24 }}>
            <video
              style={{
                width: '100%',
                outline: 'none',
              }}
              controls
              src="https://slobs-cdn.streamlabs.com/media/highlighter+promo+2.mp4"
              poster="https://slobs-cdn.streamlabs.com/media/highlighter-video-thumbnail.png"
            />
          </div>
        </div>
      </Scrollable>
    </div>
  );
}
