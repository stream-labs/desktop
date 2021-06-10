import React, { useEffect, useRef, useState } from 'react';
import { CheckCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';
import HotkeyBinding, { getBindingString } from 'components-react/shared/HotkeyBinding';
import { IHotkey } from 'services/hotkeys';
import { Services } from 'components-react/service-provider';
import { useVuex } from 'components-react/hooks';
import { Button } from 'antd';

export default function BlankSlate() {
  const { HotkeysService, SettingsService, StreamingService } = Services;
  const [hotkey, setHotkey] = useState<IHotkey | null>(null);
  const hotkeyRef = useRef<IHotkey | null>(null);
  const v = useVuex(() => ({
    settingsValues: SettingsService.views.values,
    isStreaming: StreamingService.isStreaming,
  }));

  const correctlyConfigured =
    v.settingsValues.Output.RecRB &&
    v.settingsValues.Output.RecRBTime === 20 &&
    v.settingsValues.General.ReplayBufferWhileStreaming &&
    !v.settingsValues.General.KeepReplayBufferStreamStops;

  function configure() {
    SettingsService.actions.setSettingsPatch({
      General: {
        ReplayBufferWhileStreaming: true,
        KeepRecordingWhenStreamStops: false,
      },
      Output: {
        RecRB: true,
        RecRBTime: 20,
      },
    });
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

  return (
    <div style={{ padding: 24 }}>
      <h1>Highlighter</h1>
      <p>
        The highlighter allows you to edit together replays you capture during your stream and
        upload them to YouTube.
      </p>
      <h2>Get Started</h2>
      {!v.isStreaming && (
        <div className="section">
          {correctlyConfigured
            ? completedStepHeading('Configure the replay buffer')
            : incompleteStepHeading('Configure the replay buffer')}
          {correctlyConfigured ? (
            <div>The replay buffer is correctly configured</div>
          ) : (
            <Button onClick={configure}>Configure</Button>
          )}
        </div>
      )}
      {!v.isStreaming && (
        <div className="section">
          {hotkey?.bindings.length
            ? completedStepHeading('Set a hotkey to capture replays')
            : incompleteStepHeading('Set a hotkey to capture replays')}
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
        {incompleteStepHeading('Capture a replay')}
        {!!hotkey?.bindings.length && (
          <div>
            Start streaming and press <b>{getBindingString(hotkey.bindings[0])}</b> to capture a
            replay. Check back here after your stream.
          </div>
        )}
        {!hotkey?.bindings.length && (
          <div>Start streaming and capture a replay. Check back here after your stream.</div>
        )}
      </div>
    </div>
  );
}
