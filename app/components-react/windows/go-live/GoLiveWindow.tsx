import styles from './GoLive.m.less';
import { ModalLayout } from '../../shared/ModalLayout';
import { Button } from 'antd';
import { useOnDestroy } from '../../hooks';
import { Services } from '../../service-provider';
import GoLiveSettings from './GoLiveSettings';
import React, { Profiler } from 'react';
import { $t } from '../../../services/i18n';
import GoLiveChecklist from './GoLiveChecklist';
import Form, { useForm } from '../../shared/inputs/Form';
import Animation from 'rc-animate';
import { SwitchInput } from '../../shared/inputs';
import { useGoLiveSettings } from './useGoLiveSettings';

export default function GoLiveWindow() {
  const { StreamingService, WindowsService, StreamSettingsService } = Services;
  const {
    contextValue,
    Context: GoLiveSettingsContext,
    error,
    lifecycle,
    checklist,
    isMultiplatformMode,
    goLive,
    isAdvancedMode,
    switchAdvancedMode,
    needPrepopulate,
    prepopulate,
    isLoading,
    form,
  } = useGoLiveSettings();

  const shouldShowConfirm = ['prepopulate', 'waitForNewSettings'].includes(lifecycle);
  const shouldShowSettings =
    ['empty', 'prepopulate', 'waitForNewSettings'].includes(lifecycle) && !needPrepopulate;
  const shouldShowChecklist = ['runChecklist', 'live'].includes(lifecycle);
  const shouldShowAdvancedSwitch = shouldShowConfirm && isMultiplatformMode;
  const shouldShowGoBackButton =
    lifecycle === 'runChecklist' && error && checklist.startVideoTransmission !== 'done';

  // const shouldShowChecklist = true;
  // const shouldShowSettings = false;

  // // prepopulate data for all platforms
  // useOnCreate(() => {
  //   if (['empty', 'waitForNewSettings'].includes(lifecycle)) {
  //     prepopulate();
  //   }
  // });

  // clear failed checks and warnings on window close
  useOnDestroy(() => {
    if (checklist.startVideoTransmission !== 'done') {
      StreamingService.actions.resetInfo();
    }
  });

  function close() {
    WindowsService.actions.closeChildWindow();
  }

  function goBackToSettings() {
    prepopulate();
  }

  function onRender(
    id: any, // the "id" prop of the Profiler tree that has just committed
    phase: any, // either "mount" (if the tree just mounted) or "update" (if it re-rendered)
    actualDuration: any, // time spent rendering the committed update
    baseDuration: any, // estimated time to render the entire subtree without memoization
    startTime: any, // when React began rendering this update
    commitTime: any, // when React committed this update
    interactions: any, // the Set of interactions belonging to this update
  ) {
    console.log(
      'Window render',
      id, // the "id" prop of the Profiler tree that has just committed
      'phase', // either "mount" (if the tree just mounted) or "update" (if it re-rendered)
      phase, // either "mount" (if the tree just mounted) or "update" (if it re-rendered)
      'actualDuration', // time spent rendering the committed update
      actualDuration, // time spent rendering the committed update
      'baseDuration', // estimated time to render the entire subtree without memoization
      baseDuration, // estimated time to render the entire subtree without memoization
      'startTime', // when React began rendering this update
      startTime, // when React began rendering this update
      'commitTime', // when React committed this update
      commitTime, // when React committed this update
      'interactions', // the);
      interactions,
    ); // the);
  }

  function render() {
    return (
      <Profiler id="GoLiveWindow" onRender={onRender}>
        <GoLiveSettingsContext.Provider value={contextValue}>
          <ModalLayout footer={renderFooter()}>
            <Form
              form={form}
              style={{ position: 'relative', height: '100%' }}
              layout="horizontal"
              name="editStreamForm"
            >
              <Animation transitionName="slideright">
                {/* STEP 1 - FILL OUT THE SETTINGS FORM */}
                {shouldShowSettings && <GoLiveSettings key={'settings'} />}

                {/* STEP 2 - RUN THE CHECKLIST */}
                {shouldShowChecklist && (
                  <GoLiveChecklist className={styles.page} key={'checklist'} />
                )}
              </Animation>
            </Form>
          </ModalLayout>
        </GoLiveSettingsContext.Provider>
      </Profiler>
    );
  }

  function renderFooter() {
    return (
      <Form layout={'inline'}>
        {shouldShowAdvancedSwitch && (
          <SwitchInput
            label={$t('Show Advanced Settings')}
            name="advancedMode"
            onChange={switchAdvancedMode}
            value={isAdvancedMode}
            debounce={200}
            disabled={isLoading}
          />
        )}

        {/* CLOSE BUTTON */}
        <Button onClick={close}>{$t('Close')}</Button>

        {/* GO BACK BUTTON */}
        {shouldShowGoBackButton && (
          <Button onClick={goBackToSettings}>{$t('Go back to settings')}</Button>
        )}

        {/* GO LIVE BUTTON */}
        {shouldShowConfirm && (
          <Button type="primary" onClick={goLive} disabled={isLoading}>
            {$t('Confirm & Go Live')}
          </Button>
        )}
      </Form>
    );
  }

  return render();
}
