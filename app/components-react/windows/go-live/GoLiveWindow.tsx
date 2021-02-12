import styles from './GoLive.m.less';
import cx from 'classnames';
import { ModalLayout } from '../../shared/ModalLayout';
import { Form, Button } from 'antd';
import { useAsyncState, useOnCreate, useOnDestroy, useVuex } from '../../hooks';
import { Services } from '../../service-provider';
import GoLiveSettings from './GoLiveSettings';
import React from 'react';
import { $t } from '../../../services/i18n';
import GoLiveChecklist from './GoLiveChecklist';
import { IGoLiveSettings } from '../../../services/streaming';
import SlobsForm from '../../shared/inputs/ContextForm';
import ContextForm from '../../shared/inputs/ContextForm';
import Animation from 'rc-animate';
import { SwitchInput } from '../../shared/inputs';

export default function GoLiveWindow() {
  console.log('render GoLiveWindow');
  const { StreamingService, WindowsService, StreamSettingsService } = Services;
  const [form] = Form.useForm();
  const view = StreamingService.views;

  // define a reactive state
  const v = useVuex(() => {
    const lifecycle = view.info.lifecycle;
    const shouldShowConfirm =
      lifecycle === 'waitForNewSettings' && view.enabledPlatforms.length > 0;
    const hasError = !!view.info.error;
    return {
      lifecycle,
      shouldShowConfirm,
      shouldShowSettings: ['empty', 'prepopulate', 'waitForNewSettings'].includes(lifecycle),
      shouldShowChecklist: ['runChecklist', 'live'].includes(lifecycle),
      shouldShowAdvancedSwitch: shouldShowConfirm && view.isMultiplatformMode,
      shouldShowGoBackButton:
        lifecycle === 'runChecklist' &&
        hasError &&
        view.info.checklist.startVideoTransmission !== 'done',
    };
  });

  // prepopulate data for all platforms
  useOnCreate(() => {
    if (['empty', 'waitingForNewSettings'].includes(v.lifecycle)) {
      console.log('Prepopulate');
      StreamingService.actions.prepopulateInfo();
    }
  });

  // clear failed checks and warnings on window close
  useOnDestroy(() => {
    if (view.info.checklist.startVideoTransmission !== 'done') {
      StreamingService.actions.resetInfo();
    }
  });

  // initialize the GoLive settings
  const [settings, setSettingsRaw] = useAsyncState(() => {
    // read saved settings from the local storage
    return StreamingService.views.goLiveSettings;
  });

  // define a setter for goLiveSettings
  function setSettings(newSettings: IGoLiveSettings) {
    // we should re-calculate common fields before applying new settings
    const platforms = view.applyCommonFields(newSettings.platforms);
    setSettingsRaw({
      ...newSettings,
      platforms,
    });
  }

  function goLive() {
    StreamingService.actions.goLive(settings);
  }

  function close() {
    WindowsService.actions.closeChildWindow();
  }

  function goBackToSettings() {
    StreamingService.actions.prepopulateInfo();
  }

  function switchAdvancedMode(enabled: boolean) {
    StreamSettingsService.setGoLiveSettings({ advancedMode: enabled });
  }

  function render() {
    return (
      <ModalLayout footer={renderFooter()}>
        <ContextForm
          form={form}
          style={{ position: 'relative', height: '100%' }}
          layout="horizontal"
          name="editStreamForm"
        >
          <Animation transitionName="slideright">
            {v.shouldShowSettings && (
              <GoLiveSettings
                key={'settings'}
                className={styles.page}
                settings={settings}
                setSettings={setSettings}
              />
            )}
            {v.shouldShowChecklist && <GoLiveChecklist className={styles.page} key={'checklist'} />}
          </Animation>
        </ContextForm>
      </ModalLayout>
    );
  }

  function renderFooter() {
    return (
      <>
        <SwitchInput
          label={$t('Show Advanced Settings')}
          name="advancedMode"
          onInput={enabled => switchAdvancedMode(enabled)}
          value={settings.advancedMode}
        />

        {/* CLOSE BUTTON */}
        <Button onClick={close}>{$t('Close')}</Button>

        {/* GO BACK BUTTON */}
        {v.shouldShowGoBackButton && (
          <Button onClick={goBackToSettings}>{$t('Go back to settings')}</Button>
        )}

        {/* GO LIVE BUTTON */}
        {v.shouldShowConfirm && (
          <Button type="primary" onClick={goLive}>
            {$t('Confirm & Go Live')}
          </Button>
        )}
      </>
    );
  }

  return render();
}
