import React from 'react';
import {
  CheckboxInput,
  FileInput,
  ListInput,
  MediaGalleryInput,
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
import { Alert, Button, Col, Collapse, Layout, Menu, Row, Tooltip } from 'antd';
import { DEFAULT_WIDGET_STATE, useWidget, WidgetModule } from '../useWidget';
import Form from '../../shared/inputs/Form';
import { WidgetLayout } from '../WidgetLayout';
import { CaretRightOutlined, CloseOutlined, QuestionCircleOutlined } from '@ant-design/icons';

const { Sider } = Layout;
const { Panel } = Collapse;

export function AlertBox() {
  return (
    <WidgetLayout>
      <MainPanel />
      <SubPanel />
    </WidgetLayout>
  );
}

function MainPanel() {
  const { onMenuClickHandler, layout, selectedTab } = useAlertBox();

  if (layout === 'bottom') {
    const tab = selectedTab || 'general';
    return (
      <>
        <Menu onClick={onMenuClickHandler} selectedKeys={[tab]} theme={'dark'}>
          <Menu.Item key={'general'}>{$t('General Settings')}</Menu.Item>
        </Menu>
        <AlertsList />
        <Menu onClick={onMenuClickHandler} selectedKeys={[tab]} theme={'dark'}>
          <Menu.Item key={'advanced'}>{$t('Advanced Settings')}</Menu.Item>
        </Menu>
      </>
    );
  }

  return (
    <Collapse defaultActiveKey={['general', 'alerts']} bordered={false}>
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
}

function SubPanel() {
  const { selectedTab, getAlertName, layout } = useAlertBox();

  if (layout === 'bottom') {
    const tab = selectedTab || 'general';
    if (tab === 'general') {
      return <GeneralSettings />;
    } else if (tab === 'advanced') {
      return <AdvancedSettings />;
    } else {
      return <AlertSettings type={tab as TAlertType} />;
    }
  }

  return (
    <Collapse defaultActiveKey={['alert']} bordered={false}>
      <Panel
        header={getAlertName(selectedTab)}
        key="alert"
        showArrow={false}
        extra={
          <Tooltip title={'This is alert description'} placement="left">
            <QuestionCircleOutlined style={{ marginLeft: '7px' }} />
          </Tooltip>
        }
      >
        <AlertSettings type={selectedTab as TAlertType} />
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
  const { layout } = useAlertBox();
  const formLayout = layout === 'bottom' ? 'horizontal' : 'vertical';
  return (
    <Form layout={formLayout}>
      <SliderInput label={$t('Global Alert Delay')} min={0} max={30} value={10} />
      <ListInput
        label={$t('Layout')}
        value="banner"
        options={[
          { label: 'Banner', value: 'banner' },
          { label: 'Side', value: 'side' },
          { label: 'Top', value: 'top' },
        ]}
      />
    </Form>
  );
}

function AlertsList() {
  const {
    essentialAlertTypes,
    onMenuClickHandler,
    otherAlertTypes,
    getAlertName,
    selectedTab,
    layout,
    playAlert,
  } = useAlertBox();

  const alertTypes = essentialAlertTypes.concat(otherAlertTypes);
  const theme = layout === 'bottom' ? 'dark' : 'light';

  return (
    <Menu onClick={onMenuClickHandler} selectedKeys={[selectedTab]} theme={theme}>
      {alertTypes.map((type: TAlertType) => (
        <Menu.Item key={type}>
          <CheckboxInput value={true} style={{ display: 'inline-block' }} />
          {getAlertName(type)}
          <Tooltip title={$t('Play Alert')} placement="left">
            <Button
              onClick={e => {
                e.stopPropagation();
                playAlert(type);
              }}
              type={'text'}
              style={{ position: 'absolute', right: '16px' }}
              icon={<CaretRightOutlined style={{ fontSize: '36px', color: 'white' }} />}
            />
          </Tooltip>
        </Menu.Item>
      ))}
    </Menu>
  );
}

function AlertSettings(p: { type: TAlertType }) {
  const { layout, settings } = useAlertBox();
  const formLayout = layout === 'bottom' ? 'horizontal' : 'vertical';
  let imageUrl = 'https://cdn.twitchalerts.com/twitch-bits/images/hd/1000.gif';

  switch (p.type) {
    case 'donations':
      imageUrl = settings.donation_image_href as string;
      break;
    case 'follows':
      imageUrl = settings.follow_image_href as string;
      break;
    case 'bits':
      imageUrl = settings.bits_image_href as string;
      break;
  }

  return (
    <Form layout={formLayout}>
      {p.type === 'donations' && (
        <div style={{ marginBottom: '32px' }}>
          <Alert
            message={
              <span>
                Setup donations settings <a>Click here</a>
              </span>
            }
            type="info"
            showIcon
            style={{ border: 'none', marginBottom: '16px' }}
          />
          <Alert
            message={
              <span>
                Customize your tip page where viewers can send you donations <a>Click here</a>
              </span>
            }
            type="info"
            showIcon
            style={{ border: 'none', marginBottom: '16px' }}
          />
        </div>
      )}
      <MediaGalleryInput label={$t('Image')} value={imageUrl} />
      <FileInput label={$t('Sound')} />
      <SliderInput label={$t('Sound Volume')} min={0} max={100} value={90} />
      <TextInput label={$t('Message Template')} />
    </Form>
  );
}

function AdvancedSettings() {
  const { layout } = useAlertBox();
  const formLayout = layout === 'bottom' ? 'horizontal' : 'vertical';
  return (
    <Form layout={formLayout}>
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
