import React from 'react';
import {
  CheckboxInput,
  FileInput,
  ListInput,
  NumberInput,
  SliderInput,
  SwitchInput,
  TextInput,
} from '../../shared/inputs';
import { $t } from '../../../services/i18n';
import {
  alertNameMap,
  TAlertType,
} from '../../../services/widgets/settings/alert-box/alert-box-data';
import { Button, Col, Collapse, Layout, Menu, Row, Tooltip } from 'antd';
import { DEFAULT_WIDGET_STATE, useWidget, WidgetModule } from '../useWidget';
import Form from '../../shared/inputs/Form';
import { mutation } from '../../store';
import { WidgetLayout } from '../WidgetLayout';
import { CaretRightOutlined, CloseOutlined, QuestionCircleOutlined } from '@ant-design/icons';

const { Sider } = Layout;
const { Panel } = Collapse;

// export function AlertBox() {
//   return <WidgetLayout MainPanel={MainPanel} SubPanel={SubPanel} />;
// }

export function AlertBox() {
  return (
    <WidgetLayout>
      <MainPanel />
      <SubPanel />
    </WidgetLayout>
  );
}

function MainPanel() {
  return (
    <Collapse defaultActiveKey={['general', 'alerts']} bordered={false}>
      {/*<Panel header={$t('Size')} key="size">*/}
      {/*  out text*/}
      {/*  <p>Text</p>*/}
      {/*</Panel>*/}
      {/*<Panel header={$t('Other')} key="other">*/}
      {/*  <div>*/}
      {/*    Other settings <SliderInput label={$t('Slider')} min={0} max={30} />*/}
      {/*  </div>*/}
      {/*</Panel>*/}
      {/*<GeneralSettings />*/}
      {/*<AlertsList />*/}
      <Panel header={$t('General')} key="general" showArrow={false}>
        <GeneralSettings />
      </Panel>

      <Panel header={$t('Alert Types')} key="alerts" showArrow={false}>
        <AlertsList />
      </Panel>

      <Panel header={$t('Advanced')} key="advanced">
        <AdvancedSettings />
      </Panel>
    </Collapse>
  );

  // return (
  //   <Menu mode="inline" onClick={onMenuClickHandler}>
  //     <GeneralSettings />
  //     <AlertsList />
  //   </Menu>
  // );
}

function SubPanel() {
  // return <div>This is sub panel</div>;
  const { selectedTab, getAlertName } = useAlertBox();
  return (
    <Collapse defaultActiveKey={['alert']} bordered={false}>
      <Panel
        header={getAlertName(selectedTab)}
        key="alert"
        showArrow={false}
        extra={
          <Tooltip title={'This is alert description'}>
            <QuestionCircleOutlined style={{ marginLeft: '7px' }} />
          </Tooltip>
        }
      >
        {/*<div className="ant-notification-notice ant-notification-notice-closable">*/}
        {/*  <div className="ant-notification-notice-content">*/}
        {/*    <div className="" role="alert">*/}
        {/*      <div className="ant-notification-notice-message">Notification Title</div>*/}
        {/*      <div className="ant-notification-notice-description">*/}
        {/*        I will never close automatically. This is a purposely very very long description*/}
        {/*        that has many many characters and words.*/}
        {/*      </div>*/}
        {/*    </div>*/}
        {/*  </div>*/}
        {/*  <a className="ant-notification-notice-close">*/}
        {/*    <span className="ant-notification-close-x">*/}
        {/*      <CloseOutlined />*/}
        {/*    </span>*/}
        {/*  </a>*/}
        {/*</div>*/}

        <Form layout="vertical">
          <FileInput label={$t('Image')} />
          <FileInput label={$t('Sound')} />
          <SliderInput label={$t('Sound Volume')} min={0} max={100} />
          <TextInput label={$t('Message Template')} />
        </Form>
      </Panel>
      <Panel header={$t('Advanced')} key="advanced">
        <Form layout="vertical">
          <SliderInput label={$t('Alert Duration')} min={0} max={100} />
          <ListInput label={$t('Text Animation')} options={[]} />
          <SliderInput label={$t('Alert Text Delay')} min={0} max={100} />
        </Form>
      </Panel>
    </Collapse>
  );
}

function GeneralSettings() {
  return (
    <Form layout="vertical">
      <SliderInput label={$t('Global Alert Delay')} min={0} max={30} />
    </Form>
  );

  // return (
  //   <Panel header={$t('General')} key="general">
  //     <Form layout="vertical">
  //       <SliderInput label={$t('Global Alert Delay')} min={0} max={30} />
  //     </Form>
  //   </Panel>
  // );

  // return (
  //   <Menu.ItemGroup key="general" title={$t('General')}>
  //     <Form layout="vertical">
  //       <SliderInput label={$t('Global Alert Delay')} min={0} max={30} />
  //     </Form>
  //   </Menu.ItemGroup>
  // );
}

function AlertsList() {
  const { essentialAlertTypes, toggleTab, otherAlertTypes, getAlertName } = useAlertBox();

  function onMenuClickHandler(e: { key: string }) {
    toggleTab(e.key);
  }

  return (
    <Menu title={$t('Alert Types')} onClick={onMenuClickHandler}>
      {essentialAlertTypes.map(type => (
        <Menu.Item key={type}>
          <CheckboxInput value={true} style={{ display: 'inline-block' }} />
          {getAlertName(type)}
          <Tooltip title={$t('Play Alert')}>
            <Button
              type={'text'}
              style={{ position: 'absolute', right: '16px' }}
              icon={<CaretRightOutlined style={{ fontSize: '36px', color: 'white' }} />}
            ></Button>
          </Tooltip>
        </Menu.Item>
      ))}
      {/*<Menu.SubMenu title={$t('Other Alerts')}>*/}
      {/*  {otherAlertTypes.map(type => (*/}
      {/*    <Menu.Item key={type}>{getAlertName(type)}</Menu.Item>*/}
      {/*  ))}*/}
      {/*</Menu.SubMenu>*/}
    </Menu>
  );
}

function AdvancedSettings() {
  return (
    <Form layout="vertical">
      <SliderInput label={$t('Alert Parries')} min={0} max={30} />
      <CheckboxInput label={$t('Shutdown source when not visible')} />
      <CheckboxInput label={$t('Refresh browser when source become active')} />
      {/*<SwitchInput label={$t('Use custom frame rate')} />*/}
      {/*<NumberInput label={$t('FPS')} />*/}
    </Form>
  );
}

export class AlertBoxModule extends WidgetModule {
  state = {
    ...DEFAULT_WIDGET_STATE,
  };

  private get availableAlertTypes(): TAlertType[] {
    const allTypes = alertNameMap();
    return (Object.keys(allTypes) as TAlertType[]).filter(
      alertType => `${alertType}_enabled` in this.state.settings,
    );
  }

  getAlertName(type: TAlertType | string) {
    return alertNameMap()[type];
  }

  get essentialAlertTypes(): TAlertType[] {
    return ['donations', 'follows', 'hosts', 'raids'];
  }

  get otherAlertTypes() {
    const essentialAlertTypes = this.essentialAlertTypes;
    return this.availableAlertTypes.filter(type => !essentialAlertTypes.includes(type));
  }
}

function useAlertBox() {
  return useWidget<AlertBoxModule>();
}
