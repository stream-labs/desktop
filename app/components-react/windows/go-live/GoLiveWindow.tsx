import styles from './GoLive.m.less';
import { WindowsService } from 'app-services';
import { ModalLayout } from '../../shared/ModalLayout';
import { Button } from 'antd';
import { Services } from '../../service-provider';
import GoLiveSettings from './GoLiveSettings';
import DualOutputGoLiveSettings from './dual-output/DualOutputGoLiveSettings';
import GoLiveBanner from './GoLiveInfoBanner';
import React from 'react';
import { $t } from '../../../services/i18n';
import GoLiveChecklist from './GoLiveChecklist';
import Form from '../../shared/inputs/Form';
import Animation from 'rc-animate';
import { useGoLiveSettings, useGoLiveSettingsRoot } from './useGoLiveSettings';
import { inject } from 'slap';
import cx from 'classnames';

export default function GoLiveWindow() {
  const { lifecycle, form } = useGoLiveSettingsRoot().extend(module => ({
    destroy() {
      // clear failed checks and warnings on window close
      if (module.checklist.startVideoTransmission !== 'done') {
        Services.StreamingService.actions.resetInfo();
      }
    },
  }));

  const shouldShowSettings = ['empty', 'prepopulate', 'waitForNewSettings'].includes(lifecycle);
  const shouldShowChecklist = ['runChecklist', 'live'].includes(lifecycle);
  const showDualOutput = shouldShowSettings && Services.DualOutputService.views.dualOutputMode;

  return (
    <ModalLayout
      footer={<ModalFooter />}
      className={cx({ [styles.dualOutputGoLive]: showDualOutput })}
    >
      <Form
        form={form!}
        style={{ position: 'relative', height: '100%' }}
        layout="horizontal"
        name="editStreamForm"
      >
        <Animation transitionName={shouldShowChecklist ? 'slideright' : ''}>
          {/* STEP 1 - FILL OUT THE SETTINGS FORM */}
          {showDualOutput && <DualOutputGoLiveSettings key={'settings'} />}
          {shouldShowSettings && !showDualOutput && <GoLiveSettings key={'settings'} />}

          {/* STEP 2 - RUN THE CHECKLIST */}
          {shouldShowChecklist && <GoLiveChecklist className={styles.page} key={'checklist'} />}
        </Animation>
      </Form>
    </ModalLayout>
  );
}

function ModalFooter() {
  const {
    error,
    lifecycle,
    checklist,
    goLive,
    close,
    goBackToSettings,
    isLoading,
    promptReapply,
  } = useGoLiveSettings().extend(module => ({
    windowsService: inject(WindowsService),

    close() {
      this.windowsService.actions.closeChildWindow();
    },

    goBackToSettings() {
      module.prepopulate();
    },

    get promptReapply() {
      return Services.TikTokService.promptReapply;
    },
  }));

  const shouldShowConfirm = ['prepopulate', 'waitForNewSettings'].includes(lifecycle);
  const shouldShowGoBackButton =
    lifecycle === 'runChecklist' && error && checklist.startVideoTransmission !== 'done';

  return (
    <Form layout={'inline'}>
      {promptReapply && <GoLiveBanner />}
      {/* CLOSE BUTTON */}
      <Button onClick={close}>{$t('Close')}</Button>

      {/* GO BACK BUTTON */}
      {shouldShowGoBackButton && (
        <Button onClick={goBackToSettings}>{$t('Go back to settings')}</Button>
      )}

      {/* GO LIVE BUTTON */}
      {shouldShowConfirm && (
        <Button
          data-testid="confirmGoLiveBtn"
          type="primary"
          onClick={goLive}
          disabled={isLoading || !!error}
        >
          {$t('Confirm & Go Live')}
        </Button>
      )}
    </Form>
  );
}
