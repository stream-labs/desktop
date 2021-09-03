import React from 'react';
import { SliderInput } from '../../shared/inputs';
import { $t } from '../../../services/i18n';
import {
  alertNameMap,
  TAlertType,
} from '../../../services/widgets/settings/alert-box/alert-box-data';
import { Col, Collapse, Layout, Menu, Row } from 'antd';
import { DEFAULT_WIDGET_STATE, useWidget, WidgetModule } from '../useWidget';
import Form from '../../shared/inputs/Form';
import { mutation } from '../../store';
import { WidgetLayout } from '../WidgetLayout';

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
  const { toggleTab } = useAlertBox();

  function onMenuClickHandler(e: { key: string }) {
    toggleTab(e.key);
  }

  return (
    <Collapse defaultActiveKey={['general', 'alerts']}>
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

      <Panel header={$t('Advanced Settings')} key="advanced">
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
  const { selectedTab } = useAlertBox();
  return <div>Selected item: {selectedTab}</div>;
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
  const { essentialAlertTypes, otherAlertTypes, getAlertName } = useAlertBox();

  return (
    <Menu title={$t('Alert Types')}>
      {essentialAlertTypes.map(type => (
        <Menu.Item key={type}>{getAlertName(type)}</Menu.Item>
      ))}
      {/*<Menu.SubMenu title={$t('Other Alerts')}>*/}
      {/*  {otherAlertTypes.map(type => (*/}
      {/*    <Menu.Item key={type}>{getAlertName(type)}</Menu.Item>*/}
      {/*  ))}*/}
      {/*</Menu.SubMenu>*/}
    </Menu>
  );

  // const { essentialAlertTypes, otherAlertTypes, getAlertName } = useAlertBox();
  // return (
  //   <Menu.ItemGroup key="alerts" title={$t('Alert Types')}>
  //     {essentialAlertTypes.map(type => (
  //       <Menu.Item key={type}>{getAlertName(type)}</Menu.Item>
  //     ))}
  //     <Menu.SubMenu title={$t('Other Alerts')}>
  //       {otherAlertTypes.map(type => (
  //         <Menu.Item key={type}>{getAlertName(type)}</Menu.Item>
  //       ))}
  //     </Menu.SubMenu>
  //   </Menu.ItemGroup>
  // );
}


function AdvancedSettings() {
  return (
    <Form layout="vertical">
      <SliderInput label={$t('Alert Parries')} min={0} max={30} />
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

export class AlertBoxModule extends WidgetModule {
  state = {
    ...DEFAULT_WIDGET_STATE,
  };

  // private get fieldsMetadata() {
  //   return {
  //     alertDelay: { label: $t('Global Alert Delay'), min: 0, max: 30 },
  //     interruptDelay: {
  //       title: $t('Parry Alert Delay'),
  //       min: 0,
  //       max: 20,
  //       interval: 0.5,
  //     },
  //   };
  // }

  private get availableAlertTypes(): TAlertType[] {
    const allTypes = alertNameMap();
    return (Object.keys(allTypes) as TAlertType[]).filter(
      alertType => `${alertType}_enabled` in this.state.settings,
    );
  }

  getAlertName(type: TAlertType) {
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
