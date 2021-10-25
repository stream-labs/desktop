import React from 'react';
import { Button, Collapse, Spin, Tabs } from 'antd';
import { $t } from '../../../services/i18n';
import { CodeInput, SwitchInput } from '../../shared/inputs';
import { useWidget, useWidgetRoot } from './useWidget';
import Form from '../../shared/inputs/Form';
import { useOnCreate } from '../../hooks';
import { Services } from '../../service-provider';
import { getDefined } from '../../../util/properties-type-guards';
import { ModalLayout } from '../../shared/ModalLayout';
import { components } from './WidgetWindow';
import { ButtonGroup } from '../../shared/ButtonGroup';
import { useCodeEditor } from './useCodeEditor';
import Utils from '../../../services/utils';
const { TabPane } = Tabs;

/**
 * One-off window with code editors
 */
export function CustomCodeWindow() {
  // take the source id from the window's params
  const { sourceId, WidgetModule, widgetSelectedTab } = useOnCreate(() => {
    const { WindowsService } = Services;
    const { sourceId, widgetType } = getDefined(WindowsService.state.child.queryParams);
    const { selectedTab } = getDefined(WindowsService.state[Utils.getWindowId()].queryParams);
    const [, WidgetModule] = components[widgetType];
    return { sourceId, WidgetModule, widgetSelectedTab: selectedTab };
  });

  useWidgetRoot(WidgetModule, {
    sourceId,
    shouldCreatePreviewSource: false,
    selectedTab: widgetSelectedTab,
  });
  const { selectedTab, selectTab, tabs, isLoading } = useCodeEditor();

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
  const { canSave, saveCode, reset } = useCodeEditor();
  return (
    <>
      {canSave && (
        <>
          <Button danger onClick={reset}>
            {$t('Revert Changes')}
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
  const { setCode, code, selectedTab } = useCodeEditor();
  if (selectedTab === 'json') return <JsonEditor />;
  return <CodeInput lang={selectedTab} value={code} onChange={setCode} height={590} nowrap />;
}

/**
 * Renders JSON editor
 */
function JsonEditor() {
  const { setCode, code, addCustomFields, removeCustomFields } = useCodeEditor();
  return (
    <>
      <ButtonGroup>
        {!code && <Button onClick={addCustomFields}>Generate Custom Fields</Button>}
        {code && (
          <Button danger onClick={removeCustomFields}>
            Remove Custom Fields
          </Button>
        )}
      </ButtonGroup>

      <CodeInput lang="json" value={code} onChange={setCode} height={570} nowrap />
    </>
  );
}

/**
 * Renders a collapsable section with the custom code switcher
 */
export function CustomCodeSection() {
  const { isCustomCodeEnabled, customCode, updateCustomCode, openCustomCodeEditor } = useWidget();
  if (!customCode) return <></>;

  return (
    <Collapse bordered={false}>
      <Collapse.Panel header={$t('Custom Code')} key={1}>
        <Form layout="horizontal">
          <SwitchInput
            label={$t('Enable Custom Code')}
            value={isCustomCodeEnabled}
            onChange={custom_enabled => updateCustomCode({ custom_enabled })}
          />
          {isCustomCodeEnabled && (
            <ButtonGroup>
              <Button onClick={openCustomCodeEditor}>{'Edit Custom Code'}</Button>
            </ButtonGroup>
          )}
        </Form>
      </Collapse.Panel>
    </Collapse>
  );
}
