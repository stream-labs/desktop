import React, { useMemo } from 'react';
import { useVuex } from 'components-react/hooks';
import { getOS, OS } from 'util/operating-systems';
import { $t } from 'services/i18n';
import { EVirtualWebcamPluginInstallStatus } from 'services/virtual-webcam';
import { Services } from 'components-react/service-provider';
import Translate from 'components-react/shared/Translate';
import { ObsSettingsSection } from './ObsSettings';
// import Form from 'components-react/shared/inputs/Form';
// import { ListInput } from 'components-react/shared/inputs/ListInput';
import { Button } from 'antd';
import styles from './VirtualWebcam.m.less';
import cx from 'classnames';
import { VCamOutputType } from 'obs-studio-node';
// import { show } from 'game_overlay';

export function VirtualWebcam() {
  const { VirtualWebcamService, ScenesService, SettingsService, SourcesService } = Services;

  const v = useVuex(() => ({
    running: VirtualWebcamService.views.running,
    installStatus: VirtualWebcamService.views.installStatus,
    start: VirtualWebcamService.actions.start,
    stop: VirtualWebcamService.actions.stop,
    setOutputType: VirtualWebcamService.actions.update,
  }));

  const showInstall = useMemo(() => {
    switch (v.installStatus) {
      case EVirtualWebcamPluginInstallStatus.NotPresent:
        return true;
      case EVirtualWebcamPluginInstallStatus.Outdated:
        return true;
      case EVirtualWebcamPluginInstallStatus.Installed:
        return false;
      default:
        return true;
    }
  }, [v.installStatus]);

  const isInstalled = v.installStatus === EVirtualWebcamPluginInstallStatus.Installed;
  const name = SettingsService.views.virtualWebcamSettings[0]?.parameters[0]?.name ?? '';

  return (
    <div className={cx(styles.container, styles.virtualWebcam)}>
      <ObsSettingsSection key="vw-description">
        <div className={styles.description}>
          {$t(
            'Virtual Webcam allows you to display your scenes from Streamlabs Desktop in video conferencing software. Streamlabs Desktop will appear as a Webcam that can be selected in most video conferencing apps.',
          )}
        </div>
      </ObsSettingsSection>

      {/* START/STOP */}
      {isInstalled && <ManageVirtualWebcam />}

      {/* MANAGE INSTALLATION */}
      {!showInstall && <>{'UNINSTALL'}</>}
      {showInstall && (
        <InstallVirtualWebcam
          isUpdate={v.installStatus === EVirtualWebcamPluginInstallStatus.Outdated}
          name={name}
        />
      )}
      {!showInstall && <UninstallVirtualWebcam />}
    </div>
  );
}

function ManageVirtualWebcam() {
  const { VirtualWebcamService } = Services;
  const isRunning = VirtualWebcamService.views.running;

  const buttonText = isRunning ? $t('Stop Virtual Webcam') : $t('Start Virtual Webcam');
  const statusText = isRunning
    ? $t('Virtual webcam is <status>Running</status>')
    : $t('Virtual webcam is <status>Offline</status>');

  function handleStartStop() {
    if (isRunning) {
      VirtualWebcamService.actions.stop();
    } else {
      VirtualWebcamService.actions.start();
    }
  }

  return (
    <ObsSettingsSection>
      <div className="section-content">
        <p>
          <Translate
            message={statusText}
            renderSlots={{
              status: (text: string) => {
                return (
                  <span key="vw-running" className={cx({ [styles.running]: isRunning })}>
                    <b>{text}</b>
                  </span>
                );
              },
            }}
          />
        </p>
        <button
          className={cx('button', { 'button--action': !isRunning, 'button--warn': isRunning })}
          style={{ marginBottom: '16px' }}
          onClick={() => handleStartStop()}
        >
          {buttonText}
        </button>
        {getOS() === OS.Mac && (
          <p>
            {$t(
              'If the virtual webcam does not appear in other applications, you may need to restart your computer.',
            )}
          </p>
        )}
      </div>
    </ObsSettingsSection>
  );
}

function InstallVirtualWebcam(p: { isUpdate: boolean; name: string }) {
  const message = p.isUpdate
    ? $t(
        'The Virtual Webcam plugin needs to be updated before it can be started. This requires administrator privileges.',
      )
    : $t('Virtual Webcam requires administrator privileges to be installed on your system.');

  const buttonText = p.isUpdate ? $t('Update Virtual Webcam') : $t('Install Virtual Webcam');

  function handleInstall() {
    if (p.isUpdate) {
      const type = Services.VirtualWebcamService.views.outputType;

      Services.VirtualWebcamService.actions.update((type as unknown) as VCamOutputType, p.name);
    } else {
      Services.VirtualWebcamService.actions.install();
    }
  }

  return (
    <ObsSettingsSection>
      <p>{message}</p>
      <Button
        className="button button--action"
        style={{ marginBottom: '16px' }}
        onClick={() => handleInstall()}
      >
        {buttonText}
      </Button>
    </ObsSettingsSection>
  );
}

function UninstallVirtualWebcam() {
  function handleUninstall() {
    Services.VirtualWebcamService.actions.uninstall();
  }

  return (
    <ObsSettingsSection>
      <p>
        {$t('Uninstalling Virtual Webcam will remove it as a device option in other applications.')}
      </p>
      <Button
        className="button button--default"
        style={{ marginBottom: '16px' }}
        onClick={() => handleUninstall()}
      >
        {$t('Uninstall Virtual Webcam')}
      </Button>
    </ObsSettingsSection>
  );
}

VirtualWebcam.page = 'Virtual Webcam';
