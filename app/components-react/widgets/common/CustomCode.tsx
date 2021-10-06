import React from 'react';
import { Button, Collapse, message, Spin, Tabs } from 'antd';
import { $t } from '../../../services/i18n';
import { CodeInput, SwitchInput } from '../../shared/inputs';
import { TCodeInputProps } from '../../shared/inputs/CodeInput';
import { useWidget, useWidgetRoot, WidgetModule } from './useWidget';
import Form from '../../shared/inputs/Form';
import { useOnCreate } from '../../hooks';
import { Services } from '../../service-provider';
import { getDefined } from '../../../util/properties-type-guards';
import { ModalLayout } from '../../shared/ModalLayout';
import { components } from './WidgetWindow';
import { Buttons } from '../../shared/Buttons';
import { getModuleManager, mutation, watch } from '../../store';
import { useModule } from '../../hooks/useModule';
import Utils from '../../../services/utils';
import { DEFAULT_CUSTOM_FIELDS } from './CustomFields';
const { TabPane } = Tabs;

/**
 * One-off window with code editors
 */
export function CustomCodeWindow() {
  // take the source id from the window's params
  const { sourceId, WidgetModule } = useOnCreate(() => {
    const { WindowsService } = Services;
    const { sourceId, widgetType } = getDefined(WindowsService.state.child.queryParams);
    const [, WidgetModule] = components[widgetType];
    return { sourceId, WidgetModule };
  });

  useWidgetRoot(WidgetModule, { sourceId, shouldCreatePreviewSource: false });
  const { selectedTab, selectTab, tabs, isLoading } = useEditor();

  return (
    <ModalLayout footer={<EditorFooter />}>
      {isLoading && <Spin spinning={true} />}

      {/* EDITOR TABS */}
      {!isLoading && (
        <Tabs activeKey={selectedTab} onChange={selectTab}>
          {tabs.map(tab => (
            <TabPane tab={tab.label} key={tab.key}>
              <Editor />
            </TabPane>
          ))}
        </Tabs>
      )}
    </ModalLayout>
  );
}

function EditorFooter() {
  const { canSave, saveCode, reset } = useEditor();
  return (
    <>
      {canSave && (
        <>
          <Button danger onClick={reset}>
            {$t('Undo Changes')}
          </Button>
          <Button type="primary" onClick={saveCode}>
            {$t('Save')}
          </Button>
        </>
      )}
      {!canSave && <Button onClick={close}>{$t('Close')}</Button>}
    </>
  );
}

/**
 * Renders code editor for a selected tab
 */
function Editor() {
  const { setCode, code, selectedTab } = useEditor();
  if (selectedTab === 'json') return <JsonEditor />;
  return <CodeInput lang={selectedTab} value={code} onChange={setCode} height={590} nowrap />;
}

/**
 * Renders JSON editor
 */
function JsonEditor() {
  const { setCode, code, addCustomFields, removeCustomFields } = useEditor();
  return (
    <>
      <Buttons>
        {!code && <Button onClick={addCustomFields}>Generate Custom Fields</Button>}
        {code && (
          <Button danger onClick={removeCustomFields}>
            Remove Custom Fields
          </Button>
        )}
      </Buttons>

      <CodeInput lang="json" value={code} onChange={setCode} height={570} nowrap />
    </>
  );
}

/**
 * Manages the state for Code Editor window
 */
export class CodeEditorModule {
  tabs = [
    { label: 'Custom Fields', key: 'json' },
    { label: 'HTML', key: 'html' },
    { label: 'CSS', key: 'css' },
    { label: 'JS', key: 'js' },
  ];

  state = {
    selectedTab: 'json' as TLang,
    canSave: false,
    isLoading: true,
    customCode: {
      custom_enabled: true,
      custom_json: '',
      custom_html: '',
      custom_css: '',
      custom_js: '',
    },
  };

  private widgetModule: WidgetModule = getModuleManager().getModule('WidgetModule');

  init() {
    // wait for the WidgetModule to load to get the custom code data from it
    watch(
      this,
      () => this.widgetModule.state.isLoading,
      () => this.reset(),
    );
  }

  /**
   * Save the custom code on the server
   */
  saveCode() {
    // validate code
    if (!this.hasValidJson) {
      message.error('Invalid JSON');
      return;
    }

    // save on the server
    const newCustomCode = this.state.customCode;
    const custom_json = newCustomCode.custom_json && JSON.parse(newCustomCode.custom_json);
    this.widgetModule.updateCustomCode({
      ...newCustomCode,
      custom_json,
    });
    this.disableSave();

    // ask the WidgetSettings window to reload
    Utils.sleep(1000).then(() => Services.WidgetsService.actions.invalidateSettingsWindow());
  }

  /**
   * Returns code for the selected tab
   */
  get code() {
    const { customCode, selectedTab } = this.state;
    return customCode[`custom_${selectedTab}`];
  }

  /**
   * true if custom_json is valid
   */
  get hasValidJson() {
    const json = this.state.customCode.custom_json;
    if (!json) return true;
    try {
      JSON.parse(json);
      return true;
    } catch (e: unknown) {
      return false;
    }
  }

  /**
   * save the code for the current tab in the state
   */
  @mutation()
  setCode(code: string) {
    this.state.customCode[`custom_${this.state.selectedTab}`] = code;
    this.state.canSave = true;
  }

  /**
   * close the CustomCode window
   */
  close() {
    Services.WindowsService.actions.closeOneOffWindow(Utils.getWindowId());
  }

  /**
   * reset all changes
   */
  @mutation()
  reset() {
    const customCode = this.widgetModule.customCode;
    this.state = {
      ...this.state,
      isLoading: false,
      customCode: {
        ...customCode,
        custom_json: customCode.custom_json ? JSON.stringify(customCode.custom_json, null, 2) : '',
      },
      canSave: false,
    };
  }

  @mutation()
  selectTab(tab: TLang) {
    this.state.selectedTab = tab;
  }

  @mutation()
  private disableSave() {
    this.state.canSave = false;
  }

  /**
   * Generate an example json for custom fields
   */
  @mutation()
  addCustomFields() {
    this.setCode(JSON.stringify(DEFAULT_CUSTOM_FIELDS, null, 2));
  }

  @mutation()
  removeCustomFields() {
    this.setCode('');
  }
}

function useEditor() {
  return useModule(CodeEditorModule).select();
}

/**
 * Renders a collapsable section with the custom code switcher
 */
export function CustomCodeSection() {
  const { customCode, updateCustomCode, openCustomCodeEditor } = useWidget();
  const isEnabled = customCode.custom_enabled;

  return (
    <Collapse bordered={false}>
      <Collapse.Panel header={$t('Custom Code')} key={1}>
        <Form layout="horizontal">
          <SwitchInput
            label={$t('Enable Custom Code')}
            value={isEnabled}
            onChange={custom_enabled => updateCustomCode({ custom_enabled })}
          />
          {isEnabled && (
            <Buttons>
              <Button onClick={openCustomCodeEditor}>{'Edit Custom Code'}</Button>
            </Buttons>
          )}
        </Form>
      </Collapse.Panel>
    </Collapse>
  );
}

type TLang = TCodeInputProps['lang'];
