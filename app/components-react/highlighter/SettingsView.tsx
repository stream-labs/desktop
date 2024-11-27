import React, { useEffect, useRef, useState } from 'react';
import { InfoCircleOutlined } from '@ant-design/icons';
import HotkeyBinding from 'components-react/shared/HotkeyBinding';
import { IHotkey } from 'services/hotkeys';
import { Services } from 'components-react/service-provider';
import { useVuex } from 'components-react/hooks';
import { Button } from 'antd';
import { SUPPORTED_FILE_TYPES } from 'services/highlighter/constants';
import { SliderInput, SwitchInput } from 'components-react/shared/inputs';
import Form from 'components-react/shared/inputs/Form';
import Scrollable from 'components-react/shared/Scrollable';
import styles from './SettingsView.m.less';
import { $t } from 'services/i18n';
import { EHighlighterView, IViewState } from 'services/highlighter';
import { EAvailableFeatures } from 'services/incremental-rollout';

export default function SettingsView({
  emitSetView,
  close,
}: {
  emitSetView: (data: IViewState) => void;
  close: () => void;
}) {
  const {
    HotkeysService,
    SettingsService,
    StreamingService,
    HighlighterService,
    IncrementalRolloutService,
  } = Services;
  const aiHighlighterEnabled = IncrementalRolloutService.views.featureIsEnabled(
    EAvailableFeatures.aiHighlighter,
  );
  const [hotkey, setHotkey] = useState<IHotkey | null>(null);
  const hotkeyRef = useRef<IHotkey | null>(null);

  const v = useVuex(() => ({
    settingsValues: SettingsService.views.values,
    isStreaming: StreamingService.isStreaming,
    useAiHighlighter: HighlighterService.views.useAiHighlighter,
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
        {/* <CheckCircleOutlined style={{ color: 'var(--teal)', fontSize: 24, marginRight: 8 }} /> */}
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

  function toggleUseAiHighlighter() {
    HighlighterService.actions.toggleAiHighlighter();
  }

  function headerBarTag(text: string) {
    return (
      <div
        style={{
          margin: 0,
          marginLeft: '4px',
          fontSize: '14px',
          padding: '2px 6px',
          borderRadius: '4px',
          backgroundColor: '#2B383F',
        }}
      >
        <p style={{ margin: 0 }}>{text}</p>
      </div>
    );
  }

  return (
    <div
      className={styles.settingsViewRoot}
      style={{ width: '100%', display: 'flex', flexDirection: 'column' }}
    >
      <div style={{ display: 'flex', padding: 20 }}>
        <div style={{ flexGrow: 1 }}>
          <h1 style={{ margin: 0 }}>{$t('Highlighter')}</h1>
          <p>
            {$t(
              'The highlighter allows you to clip the best moments from your livestream and edit them together into an exciting highlight video you can upload directly to YouTube.',
            )}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          {aiHighlighterEnabled && (
            <Button onClick={() => emitSetView({ view: EHighlighterView.STREAM })}>
              Stream highlights
            </Button>
          )}
          <Button onClick={() => emitSetView({ view: EHighlighterView.CLIPS, id: undefined })}>
            All clips
          </Button>
        </div>
      </div>

      <Scrollable style={{ flexGrow: 1, padding: '20px 20px 20px 20px', width: '100%' }}>
        <div
          style={{
            display: 'flex',
            backgroundColor: '#09161D',
            padding: '56px',
            borderRadius: '24px',
            gap: '24px',
          }}
        >
          <div className={styles.cardWrapper}>
            {aiHighlighterEnabled && (
              <div className={styles.highlighterCard}>
                <div className={styles.cardHeaderbarWrapper}>
                  <div className={styles.cardHeaderbar}>
                    <i style={{ margin: 0, fontSize: '20px' }} className="icon-highlighter"></i>
                    <h3 style={{ margin: 0, fontSize: '20px' }}> AI Highlighter</h3>
                    {headerBarTag('For Fortnite streams (Beta)')}
                  </div>
                </div>

                <p style={{ margin: 0 }}>
                  Automatically capture the best moments from your livestream and turn them into a
                  highlight video.
                </p>

                <SwitchInput
                  style={{ margin: 0, marginLeft: '-10px' }}
                  size="default"
                  value={v.useAiHighlighter}
                  onChange={toggleUseAiHighlighter}
                />
                <div
                  style={{
                    position: 'absolute',
                    right: 0,
                    bottom: 0,
                    borderRadius: '16px 0 9px 0',
                    padding: '8px',
                    paddingBottom: '5px',
                    backgroundColor: '#2b5bd7',
                    height: 'fit-content',
                  }}
                >
                  Recommended
                </div>
              </div>
            )}
            <div className={styles.manualCard}>
              <div className={styles.cardHeaderbarWrapper}>
                <div className={styles.cardHeaderbar}>
                  <h3 style={{ margin: 0, fontSize: '20px' }}>
                    {' '}
                    {aiHighlighterEnabled ? 'Or use the manual highlighter ' : 'Manual highlighter'}
                  </h3>
                </div>
              </div>
              <p>
                Manually capture the best moments from your livestream with a hotkey command, and
                automatically turn them into a highlight video.
              </p>
              <div style={{ display: 'flex', gap: '16px' }}>
                {!v.isStreaming && !correctlyConfigured && (
                  <div
                    className={styles.settingSection}
                    style={{
                      width: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                    }}
                  >
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
                {v.isStreaming && (
                  <div className={styles.settingSection} style={{ width: '100%' }}>
                    <p>End your stream to change the Hotkey or the replay duration.</p>
                  </div>
                )}

                {!v.isStreaming && (
                  <div
                    className={styles.settingSection}
                    style={{
                      width: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                    }}
                  >
                    {hotkey?.bindings.length
                      ? completedStepHeading($t('Set a hotkey to capture replays'))
                      : incompleteStepHeading($t('Set a hotkey to capture replays'))}
                    {hotkey && (
                      //TODO: if now label is added, remove the min width of the label div and remove the -16 margin left here
                      <HotkeyBinding
                        style={{ width: 'calc(100% + 14px)', marginLeft: '-10px' }}
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
                {!v.isStreaming && (
                  <div className={styles.settingSection} style={{ width: '100%' }}>
                    {completedStepHeading($t('Adjust replay duration'))}
                    <Form layout="inline">
                      <SliderInput
                        style={{ width: 'calc(100% + 14px)', marginLeft: '-10px' }}
                        // label={$t('Replay Duration')}
                        label={null}
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
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              paddingLeft: 24,
              width: '100%',
              backgroundImage: 'url(https://slobs-cdn.streamlabs.com/media/highlighter-image.png)',
              backgroundPosition: 'center',
              backgroundSize: 'contain',
              backgroundRepeat: 'no-repeat',
            }}
          ></div>
        </div>
      </Scrollable>
    </div>
  );
}
