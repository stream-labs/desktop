import React, { useMemo } from 'react';
import { useVuex } from 'components-react/hooks';
import { getOS, OS } from 'util/operating-systems';
import { $t } from 'services/i18n';
import { EVirtualWebcamPluginInstallStatus } from 'services/virtual-webcam';
import { Services } from 'components-react/service-provider';
import Translate from 'components-react/shared/Translate';
import { VCamOutputType } from 'obs-studio-node';
import { ObsSettingsSection } from './ObsSettings';
import Form from 'components-react/shared/inputs/Form';
import { ListInput } from 'components-react/shared/inputs/ListInput';
import { Button } from 'antd';
import styles from './VirtualWebcam.m.less';
import cx from 'classnames';

export function VirtualWebcamSettings() {
  const { VirtualWebcamService, ScenesService, SettingsService, SourcesService } = Services;

  const v = useVuex(() => ({
    running: VirtualWebcamService.views.running,
    outputType: VirtualWebcamService.views.outputType,
    outputSelection: SettingsService.views.virtualWebcamOutputSelection,
    installStatus: VirtualWebcamService.views.installStatus,
    start: VirtualWebcamService.actions.start,
    stop: VirtualWebcamService.actions.stop,
    setOutputType: VirtualWebcamService.actions.update,
  }));

  const OUTPUT_TYPE_OPTIONS = [
    { label: $t('Program (default)'), value: VCamOutputType.ProgramView.toString() },
    // {label: $t('Preview'), value: VCamOutputType.PreviewOutput}, // VCam for studio mode, is not implemented right now
    { label: $t('Scene'), value: VCamOutputType.SceneOutput.toString() },
    { label: $t('Source'), value: VCamOutputType.SourceOutput.toString() },
  ];

  const outputSelectionOptions = useMemo(() => {
    // set the options based on the selected virtual cam
    let options = [{ label: 'None', value: '' }];

    if (v.outputType === VCamOutputType.SceneOutput.toString()) {
      options = ScenesService.views.scenes.map(scene => ({
        label: scene.name,
        value: scene.id,
      }));
    }

    if (v.outputType === VCamOutputType.SourceOutput.toString()) {
      options = SourcesService.views
        .getSources()
        .filter(source => source.type !== 'scene' && source.video)
        .map(source => ({
          label: source.name,
          value: source.sourceId,
        }));
    }

    // set the default virtual webcam output (skip if using the default options because
    // it was already set in the onSelect)
    if (options.length) {
      const selected = options[0].value;
      SettingsService.setSettingValue('Virtual Webcam', 'OutputSelection', selected);
    }

    return options;
  }, [v.outputType, v.outputSelection]);

  const outputSelectionValue = useMemo(() => {
    if (!outputSelectionOptions.length) return { label: 'None', value: '' };

    const outputSelection =
      outputSelectionOptions.find(o => o.value === v.outputSelection) ?? outputSelectionOptions[0];

    SettingsService.setSettingValue('Virtual Webcam', 'OutputSelection', outputSelection.value);
    VirtualWebcamService.update((v.outputType as unknown) as VCamOutputType, outputSelection.value);

    return outputSelection;
  }, [v.outputSelection, outputSelectionOptions]);

  const showOutputSelection =
    v.outputType === VCamOutputType.SceneOutput.toString() ||
    v.outputType === VCamOutputType.SourceOutput.toString();

  const showOutputLabel =
    v.outputType === VCamOutputType.SceneOutput.toString()
      ? $t('Output Scene')
      : $t('Output Source');

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

  function onSelectType(value: string, label: string) {
    const shouldResetDefault = [
      VCamOutputType.SceneOutput.toString(),
      VCamOutputType.SourceOutput.toString(),
    ].includes(value);

    // when switching to the default type, clear the output selection
    if (shouldResetDefault) {
      SettingsService.setSettingValue('Virtual Webcam', 'OutputSelection', '');
    }

    v.setOutputType((value as unknown) as VCamOutputType, label);
  }

  function onSelectSelection(value: string) {
    SettingsService.setSettingValue('Virtual Webcam', 'OutputSelection', value);
    VirtualWebcamService.update((v.outputType as unknown) as VCamOutputType, value);
  }

  return (
    <div className={cx(styles.container, styles.virtualWebcam)}>
      <ObsSettingsSection key="vw-description">
        <div className={styles.description}>
          {$t(
            'Virtual Webcam allows you to display your scenes from Streamlabs Desktop in video conferencing software. Streamlabs Desktop will appear as a Webcam that can be selected in most video conferencing apps.',
          )}
        </div>
      </ObsSettingsSection>

      {/* MANAGE TARGET */}
      <ObsSettingsSection key="vw-type">
        <Form>
          <ListInput
            label={$t('Output Type')}
            options={OUTPUT_TYPE_OPTIONS}
            value={v.outputType}
            defaultValue={OUTPUT_TYPE_OPTIONS[0].value}
            onSelect={(val: string, opts) => {
              onSelectType(val, opts.labelrender);
            }}
            allowClear={false}
            style={{ width: '100%' }}
          />
        </Form>
      </ObsSettingsSection>

      {showOutputSelection && (
        <ObsSettingsSection key="vw-selection">
          <Form>
            <ListInput
              label={showOutputLabel}
              options={outputSelectionOptions}
              value={outputSelectionValue.value}
              onSelect={(val, opts) => {
                onSelectSelection(val);
              }}
              allowClear={false}
              style={{ width: '100%' }}
            />
          </Form>
        </ObsSettingsSection>
      )}

      {/* START/STOP */}
      {isInstalled && <ManageVirtualWebcam />}

      {/* MANAGE INSTALLATION */}
      {showInstall && (
        <InstallVirtualWebcam
          isUpdate={v.installStatus === EVirtualWebcamPluginInstallStatus.Outdated}
          name={outputSelectionValue.value}
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

VirtualWebcamSettings.page = 'Virtual Webcam';
