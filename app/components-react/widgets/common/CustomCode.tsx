import React from 'react';
import { Alert, Button, Collapse, message, Space, Spin, Tabs } from 'antd';
import { $t } from '../../../services/i18n';
import {
  CodeInput,
  ColorInput,
  ListInput,
  MediaGalleryInput,
  SliderInput,
  SwitchInput,
  TextInput,
} from '../../shared/inputs';
import { TCodeInputProps } from '../../shared/inputs/CodeInput';
import { ICustomField, useWidget, useWidgetRoot, WidgetModule } from './useWidget';
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
import InputWrapper from '../../shared/inputs/InputWrapper';
const { TabPane } = Tabs;

export function CustomCodeWindow() {
  // take the source id and widget's component from the window's params
  const { sourceId, WidgetModule } = useOnCreate(() => {
    const { WindowsService } = Services;
    const { sourceId, widgetType } = getDefined(WindowsService.state.child.queryParams);
    const [, WidgetModule] = components[widgetType];
    return { sourceId, WidgetModule };
  });

  // initialize the Redux module for the widget
  // so all children components can use it via `useWidget()` call
  useWidgetRoot(WidgetModule, { sourceId, shouldCreatePreviewSource: false });
  const { selectedTab, selectTab, tabs, isLoading } = useEditor();

  return (
    <ModalLayout footer={<EditorFooter />}>
      {isLoading && <Spin spinning={true} />}

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

function Editor() {
  const { setCode, code, selectedTab } = useEditor();
  if (selectedTab === 'json') {
    return <JsonEditor />;
  }
  return <CodeInput lang={selectedTab} value={code} onChange={setCode} height={590} nowrap />;
}

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

type TLang = TCodeInputProps['lang'];

export class CodeEditorModule {
  tabs = [
    { label: 'Custom Fields', key: 'json' },
    { label: 'HTML', key: 'html' },
    { label: 'CSS', key: 'css' },
    { label: 'JS', key: 'js' },
  ];

  private widgetModule: WidgetModule = getModuleManager().getModule('WidgetModule');

  init() {
    watch(
      this,
      () => this.widgetModule.state.isLoading,
      () => this.reset(),
    );
  }

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

  saveCode() {
    if (!this.hasValidJson) {
      message.error('Invalid JSON');
      return;
    }
    const newCustomCode = this.state.customCode;
    const custom_json = newCustomCode.custom_json && JSON.parse(newCustomCode.custom_json);
    this.widgetModule.updateCustomCode({
      ...newCustomCode,
      custom_json,
    });
    this.disableSave();
    Utils.sleep(1000).then(() => Services.WidgetsService.actions.invalidateSettingsWindow());
  }

  get code() {
    const { customCode, selectedTab } = this.state;
    return customCode[`custom_${selectedTab}`];
  }

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

  @mutation()
  setCode(code: string) {
    this.state.customCode[`custom_${this.state.selectedTab}`] = code;
    this.state.canSave = true;
  }

  close() {
    Services.WindowsService.actions.closeOneOffWindow(Utils.getWindowId());
  }

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

export function CustomFieldsSection() {
  const { openCustomCodeEditor } = useWidget();
  return (
    <Collapse bordered={false}>
      <Collapse.Panel header={$t('Custom Fields')} key={1}>
        <CustomFields />
        <InputWrapper>
          <Button onClick={openCustomCodeEditor}>Add or Remove Fields</Button>
        </InputWrapper>
      </Collapse.Panel>
    </Collapse>
  );
}

export function CustomFields() {
  const { customCode, updateCustomCode } = useWidget();
  const json = customCode.custom_json || {};

  function onFieldChange(fieldName: string, value: any) {
    const newFieldProps = { ...json[fieldName], value };
    updateCustomCode({ custom_json: { ...json, [fieldName]: newFieldProps } });
  }

  const fieldsProps = Object.keys(json).map(name => ({
    name,
    ...json[name],
    onChange: (value: any) => {
      onFieldChange(name, value);
    },
  }));

  return (
    <Form layout="horizontal">
      {fieldsProps.map(props => (
        <CustomField {...props} key={props.name} />
      ))}
    </Form>
  );
}

function CustomField(p: ICustomField & { name: string; onChange: (val: any) => unknown }) {
  const commonProps = { name: p.name, label: p.label, value: p.value, onChange: p.onChange };

  switch (p.type) {
    case 'colorpicker':
      return <ColorInput {...commonProps} />;

    case 'slider':
      return <SliderInput {...commonProps} min={p.min} max={p.max} step={p.steps} debounce={500} />;

    case 'textfield':
      return <TextInput {...commonProps} />;

    case 'dropdown':
      return (
        <ListInput
          {...commonProps}
          options={Object.keys(p.options!).map(key => ({ value: key, label: p.options![key] }))}
        />
      );

    case 'sound-input':
      return <MediaGalleryInput {...commonProps} isAudio />;
    case 'image-input':
      return <MediaGalleryInput {...commonProps} />;
    default:
      return <></>;
  }
}

const DEFAULT_CUSTOM_FIELDS: Record<string, ICustomField> = {
  customField1: {
    label: 'Color Picker Example',
    type: 'colorpicker',
    value: '#000EF0',
  },

  customField2: {
    label: 'Slider Example',
    type: 'slider',
    value: 100,
    max: 200,
    min: 100,
    steps: 4,
  },

  customField3: {
    label: 'Textfield Example',
    type: 'textfield',
    value: 'Hi There',
  },

  customField4: {
    label: 'Font Picker Example',
    type: 'fontpicker',
    value: 'Open Sans',
  },

  customField5: {
    label: 'Dropdown Example',
    type: 'dropdown',
    options: {
      optionA: 'Option A',
      optionB: 'Option B',
      optionC: 'Option C',
    },
    value: 'optionB',
  },

  customField6: {
    label: 'Image Input Example',
    type: 'image-input',
    value: null,
  },

  customField7: {
    label: 'Sound Input Example',
    type: 'sound-input',
    value: null,
  },
};
