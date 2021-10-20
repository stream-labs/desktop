/**
 * Components for AlertBox widget
 */

import React from 'react';
import {
  CheckboxInput,
  MediaUrlInput,
  NumberInput,
  SliderInput,
  TextInput,
  AudioUrlInput,
} from '../shared/inputs';
import { $t } from '../../services/i18n';
import { Alert, Button, Menu, Tooltip } from 'antd';
import Form from '../shared/inputs/Form';
import { WidgetLayout } from './common/WidgetLayout';
import { CaretRightOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { TAlertType } from '../../services/widgets/widget-config';
import { useAlertBox } from './useAlertBox';
import { useForceUpdate } from '../hooks';
import electron from 'electron';
import { Services } from '../service-provider';
import { ButtonGroup } from '../shared/ButtonGroup';
import { LayoutInput } from './common/LayoutInput';

/**
 * Root component
 */
export function AlertBox() {
  // use 2 columns layout
  return (
    <WidgetLayout>
      <TabsList />
      <TabContent />
    </WidgetLayout>
  );
}

/**
 * Renders left menu
 */
function TabsList() {
  const { onMenuClickHandler, selectedTab } = useAlertBox();
  return (
    <>
      <Menu onClick={onMenuClickHandler} selectedKeys={[selectedTab]} theme={'dark'}>
        <Menu.Item key={'general'}>{$t('General Settings')}</Menu.Item>
      </Menu>
      <AlertsList />
    </>
  );
}

/**
 * Renders selected tab content
 */
function TabContent() {
  const { selectedTab } = useAlertBox();
  return selectedTab === 'general' ? (
    <GeneralSettings />
  ) : (
    <VariationSettings type={selectedTab as TAlertType} />
  );
}

/**
 * Renders general settings
 */
function GeneralSettings() {
  const { bind } = useAlertBox();
  return (
    <Form layout={'horizontal'}>
      <SliderInput
        label={$t('Global Alert Delay')}
        {...bind.alert_delay}
        step={1000}
        min={0}
        max={30000}
        tipFormatter={(ms: number) => `${ms / 1000}s`}
        debounce={500}
      />
      <LegacyLink />
    </Form>
  );
}

/**
 * Shows a link for switching to legacy components
 */
function LegacyLink() {
  const { switchToLegacyAlertbox } = useAlertBox();
  return (
    <Alert
      message={
        <span>
          {$t('Looking for the old AlertBox settings?')} <a>{$t('Click here')}</a>
        </span>
      }
      onClick={switchToLegacyAlertbox}
      type="info"
      showIcon
      style={{ marginBottom: '16px' }}
    />
  );
}

/**
 * List of alerts with "Play Alert" buttons
 */
function AlertsList() {
  const {
    onMenuClickHandler,
    alerts,
    selectedTab,
    playAlert,
    setEnabled,
    enabledAlerts,
    openAlertInfo,
  } = useAlertBox();

  return (
    <Menu onClick={onMenuClickHandler} selectedKeys={[selectedTab]} theme={'dark'}>
      {alerts.map(alertEvent => (
        <Menu.Item key={alertEvent.type}>
          {/* ON/OF CHECKBOX */}
          <CheckboxInput
            value={enabledAlerts.includes(alertEvent.type)}
            onChange={val => setEnabled(alertEvent.type, val)}
            style={{ display: 'inline-block' }}
          />

          {/* NAME AND TOOLTIP */}
          {alertEvent.name}
          {alertEvent.tooltip && (
            <Tooltip
              title={
                <span>
                  {alertEvent.tooltip}
                  {alertEvent.tooltipLink && (
                    <ButtonGroup>
                      <Button type="link" onClick={() => openAlertInfo(alertEvent.type)}>
                        {$t('More Info')}
                      </Button>
                    </ButtonGroup>
                  )}
                </span>
              }
            >
              <QuestionCircleOutlined style={{ marginLeft: '7px' }} />
            </Tooltip>
          )}

          {/* "PLAY ALERT" BUTTON */}
          <Tooltip title={$t('Play Alert')} placement="left">
            <Button
              onClick={e => {
                e.stopPropagation();
                playAlert(alertEvent.type);
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

/**
 * Settings for a selected Alert
 */
function VariationSettings(p: { type: TAlertType }) {
  const { createVariationBinding, isCustomCodeEnabled } = useAlertBox();
  const bind = createVariationBinding(p.type, 'default', useForceUpdate());
  return (
    <div>
      {/* ALERT SETTINGS  */}
      <MediaUrlInput {...bind.image_href} />
      {!isCustomCodeEnabled && <LayoutInput {...bind.layout} />}
      <AudioUrlInput {...bind.sound_href} />
      <SliderInput debounce={500} {...bind.sound_volume} />
      <TextInput {...bind.message_template} />
      <SliderInput {...bind.alert_duration} />
      {p.type === 'donation' && <DonationSettings />}
    </div>
  );
}

/**
 * Additional settings for donation alerts
 */
function DonationSettings() {
  const { createVariationBinding } = useAlertBox();
  const bind = createVariationBinding('donation', 'default', useForceUpdate());
  const { HostsService, UsageStatisticsService, MagicLinkService } = Services;
  const host = HostsService.streamlabs;

  function openDonationSettings() {
    MagicLinkService.actions.openDonationSettings();
  }

  function openTipPageSettings() {
    electron.remote.shell.openExternal(`https://${host}/editor?ref=slobs`);
    UsageStatisticsService.actions.recordFeatureUsage('openDonationSettings');
  }

  return (
    <>
      <NumberInput {...bind.alert_message_min_amount} />
      <div style={{ marginBottom: '32px' }}>
        <Alert
          message={
            <span>
              {$t('Need to set up tipping?')} <a>{$t('Click here')}</a>
            </span>
          }
          type="info"
          showIcon
          style={{ marginBottom: '16px' }}
          onClick={openDonationSettings}
        />
        <Alert
          message={
            <span>
              {$t('Customize your tip page where viewers can send you donations')}
              <a onClick={openTipPageSettings}> {$t('Click here')}</a>
            </span>
          }
          type="info"
          showIcon
          style={{ marginBottom: '16px' }}
        />
      </div>
    </>
  );
}
