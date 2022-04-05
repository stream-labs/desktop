import React, { useEffect, useState } from 'react';
import { Menu } from 'antd';
import * as remote from '@electron/remote';
import cx from 'classnames';
import { TSourceType, ISourceApi, ISourceAddOptions } from 'services/sources';
import { WidgetDisplayData } from 'services/widgets';
import { $t } from 'services/i18n';
import { ModalLayout } from 'components-react/shared/ModalLayout';
import Display from 'components-react/shared/Display';
import { Services } from 'components-react/service-provider';
import { useVuex } from 'components-react/hooks';
import styles from './AddSource.m.less';
import { TextInput, SwitchInput } from 'components-react/shared/inputs';
import Form, { useForm } from 'components-react/shared/inputs/Form';

export default function AddSource() {
  const {
    SourcesService,
    ScenesService,
    WindowsService,
    WidgetsService,
    PlatformAppsService,
    EditorCommandsService,
    UserService,
    AudioService,
  } = Services;

  const sourceType = WindowsService.getChildWindowQueryParams().sourceType as TSourceType;
  const sourceAddOptions = (WindowsService.getChildWindowQueryParams().sourceAddOptions || {
    propertiesManagerSettings: {},
  }) as ISourceAddOptions;
  const widgetType = sourceAddOptions.propertiesManagerSettings?.widgetType;

  const { platform, activeScene, sources } = useVuex(() => ({
    platform: UserService.views.platform?.type,
    activeScene: ScenesService.views.activeScene,
    sources: SourcesService.views.getSources().filter(source => {
      if (!sourceAddOptions.propertiesManager) return false;
      const comparison = {
        type: sourceType,
        propertiesManager: sourceAddOptions.propertiesManager,
        appId: sourceAddOptions.propertiesManagerSettings?.appId,
        appSourceId: sourceAddOptions.propertiesManagerSettings?.appSourceId,
        widgetType,
      };
      const isSameType = source.isSameType(
        comparison.propertiesManager === 'streamlabels'
          ? { ...comparison, isStreamlabel: true }
          : comparison,
      );
      return isSameType && source.sourceId !== ScenesService.views.activeSceneId;
    }),
  }));

  const [name, setName] = useState('');
  const [overrideExistingSource, setOverrideExistingSource] = useState(false);
  const [selectedSourceId, setSelectedSourceId] = useState(sources[0].sourceId || '');
  const form = useForm();

  const existingSources = sources.map(source => ({ name: source.name, value: source.sourceId }));

  useEffect(() => {
    const suggestName = (name: string) => SourcesService.views.suggestName(name);
    let name;
    if (sourceAddOptions.propertiesManager === 'replay') {
      name = $t('Instant Replay');
    } else if (sourceAddOptions.propertiesManager === 'streamlabels') {
      name = $t('Stream Label');
    } else if (sourceAddOptions.propertiesManager === 'iconLibrary') {
      name = $t('Custom Icon');
    } else if (sourceAddOptions.propertiesManager === 'widget') {
      name = suggestName(WidgetDisplayData(platform)[widgetType].name);
    } else if (sourceAddOptions.propertiesManager === 'platformApp') {
      const app = PlatformAppsService.views.getApp(
        sourceAddOptions.propertiesManagerSettings?.appId,
      );
      const sourceName = app?.manifest.sources.find(
        source => source.id === sourceAddOptions.propertiesManagerSettings?.appSourceId,
      )?.name;

      name = suggestName(sourceName || '');
    } else {
      const sourceDescription =
        sourceType &&
        SourcesService.getAvailableSourcesTypesList().find(
          sourceTypeDef => sourceTypeDef.value === sourceType,
        )?.description;

      name = suggestName(sourceDescription || '');
    }
    setName(name);
  }, []);

  function close() {
    WindowsService.actions.closeChildWindow();
  }

  function isNewSource() {
    if (sourceType === 'scene') return false;
    return overrideExistingSource || !existingSources.length;
  }

  function addExisting() {
    if (!selectedSourceId || !activeScene) return;
    if (!activeScene.canAddSource(selectedSourceId)) {
      // for now only a scene-source can be a problem
      remote.dialog.showErrorBox(
        $t('Error'),
        $t(
          'Unable to add a source: the scene you are trying to add already contains your current scene',
        ),
      );
      return;
    }
    EditorCommandsService.actions.executeCommand(
      'CreateExistingItemCommand',
      activeScene.id,
      selectedSourceId,
    );
    close();
  }

  async function addNew() {
    if (!activeScene) return;
    try {
      await form.validateFields();
    } catch (e: unknown) {
      return;
    }
    let source: ISourceApi;
    if (sourceAddOptions.propertiesManager === 'widget') {
      const widget = await WidgetsService.actions.return.createWidget(widgetType, name);
      source = widget.getSource();
    } else {
      const settings: Dictionary<any> = {};
      if (sourceAddOptions.propertiesManager === 'platformApp') {
        const { width, height } = await PlatformAppsService.actions.return.getAppSourceSize(
          sourceAddOptions.propertiesManagerSettings?.appId,
          sourceAddOptions.propertiesManagerSettings?.appSourceId,
        );
        settings.width = width;
        settings.height = height;
      }
      const item = EditorCommandsService.actions.executeCommand(
        'CreateNewItemCommand',
        activeScene.id,
        name,
        sourceType,
        settings,
        {
          sourceAddOptions: {
            propertiesManager: sourceAddOptions.propertiesManager,
            propertiesManagerSettings: sourceAddOptions.propertiesManagerSettings,
          },
        },
      );
      source = item.source;
    }
    if (!source.video && source.hasProps()) {
      AudioService.actions.showAdvancedSettings(source.sourceId);
    } else if (source.hasProps()) {
      SourcesService.actions.showSourceProperties(source.sourceId);
    } else {
      close();
    }
  }

  function handleSubmit() {
    isNewSource() ? addNew() : addExisting();
  }

  function Footer() {
    return (
      <>
        <div className={styles.newSourceToggle}>
          {existingSources.length > 0 && sourceType !== 'scene' && (
            <SwitchInput
              value={overrideExistingSource}
              onChange={setOverrideExistingSource}
              label={$t('Add a new source instead')}
            />
          )}
        </div>
        <button className="button button--default" onClick={close} style={{ marginRight: '6px' }}>
          {$t('Cancel')}
        </button>
        <button className="button button--action" onClick={handleSubmit}>
          {$t('Add Source')}
        </button>
      </>
    );
  }

  return (
    <ModalLayout footer={<Footer />}>
      <div className={styles.container}>
        {!isNewSource() && (
          <>
            <div>
              <h4>
                {$t('Add Existing Source')}
                {sourceAddOptions.propertiesManager === 'widget' && existingSources.length > 0 && (
                  <span className={styles.recommendedLabel}>{$t('Recommended')}</span>
                )}
              </h4>
              <Menu
                mode="vertical"
                selectedKeys={[selectedSourceId]}
                style={{ width: 300 }}
                onClick={({ key }: { key: string }) => setSelectedSourceId(key)}
              >
                {existingSources.map(source => (
                  <Menu.Item key={source.value}>{source.name}</Menu.Item>
                ))}
              </Menu>
            </div>
            {selectedSourceId && (
              <Display sourceId={selectedSourceId} style={{ width: '200px', height: '200px' }} />
            )}
          </>
        )}
        {isNewSource() && (
          <Form form={form} name="addNewSourceForm" onFinish={addNew}>
            <h4>{$t('Add New Source')}</h4>
            <TextInput
              label={$t('Please enter the name of the source')}
              value={name}
              onChange={setName}
              autoFocus
              required
              layout="vertical"
            />
          </Form>
        )}
      </div>
    </ModalLayout>
  );
}
