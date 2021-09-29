import React from 'react';
import {
  CheckboxInput,
  createBinding,
  FileInput,
  ListInput,
  MediaGalleryInput, metadata,
  SliderInput,
  TextInput,
} from '../../shared/inputs';
import { $t } from '../../../services/i18n';
import { alertNameMap } from '../../../services/widgets/settings/alert-box/alert-box-data';
import { Alert, Button, Collapse, Layout, Menu, Tooltip } from 'antd';
import { DEFAULT_WIDGET_STATE, IWidgetState, useWidget, WidgetModule } from '../useWidget';
import Form from '../../shared/inputs/Form';
import { WidgetLayout } from '../WidgetLayout';
import { CaretRightOutlined } from '@ant-design/icons';
import { Services } from '../../service-provider';
import { values } from 'lodash';
import { IAlertInfo, TAlertType } from '../../../services/widgets/widget-settings';
import { mutation, useSelector } from '../../store';

export function AlertBox() {
  return (
    <WidgetLayout>
      <TabsList />
      <TabContent />
    </WidgetLayout>
  );
}

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

function TabContent() {
  const { selectedTab } = useAlertBox();
  return selectedTab === 'general' ? (
    <GeneralSettings />
  ) : (
    <VariationSettings type={selectedTab as TAlertType} />
  );
}

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
      <ListInput
        label={$t('Layout')}
        {...bind.layout}
        options={[
          { label: 'Banner', value: 'banner' },
          { label: 'Side', value: 'side' },
          { label: 'Top', value: 'top' },
        ]}
      />
      <LegacyLink />
    </Form>
  );
}

function LegacyLink() {
  const { switchToLegacyAlertbox } = useAlertBox();
  return (
    <Alert
      message={
        <span>
          Looking for an legacy AlertBox Settings? <a>Click here</a>
        </span>
      }
      onClick={switchToLegacyAlertbox}
      type="info"
      showIcon
      style={{ marginBottom: '16px' }}
    />
  );
}

function AlertsList() {
  const { onMenuClickHandler, eventsInfo, selectedTab, playAlert } = useAlertBox();
  const alertEvents = values(eventsInfo) as IAlertInfo[];

  return (
    <Menu onClick={onMenuClickHandler} selectedKeys={[selectedTab]} theme={'dark'}>
      {alertEvents.map(alertEvent => (
        <Menu.Item key={alertEvent.type}>
          <CheckboxInput value={true} style={{ display: 'inline-block' }} />
          {alertEvent.name}
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

function VariationSettings(p: { type: TAlertType }) {
  const imageUrl = 'https://cdn.twitchalerts.com/twitch-bits/images/hd/1000.gif';
  const { module, updateVariationSettings } = useAlertBox();
  const variationSettings = useSelector(() => module.state.variations[p.type]['default']);
  const bind = createBinding(variationSettings, newSettings =>
    updateVariationSettings(p.type, newSettings),
  );

  return (
    <div>
      <MediaGalleryInput label={$t('Image')} {...bind.image_href} />
      <MediaGalleryInput label={$t('Sound')} isAudio {...bind.sound_href} />
      <SliderInput label={$t('Sound Volume')} {...bind.sound_volume} min={0} max={100} />
      <TextInput label={$t('Message Template')} {...bind.message_template} />
      {p.type === 'donation' && <DonationHelperLinks />}
    </div>
  );
}

function DonationHelperLinks() {
  return (
    <div style={{ marginBottom: '32px' }}>
      <Alert
        message={
          <span>
            Add a payment method? <a>Click here</a>
          </span>
        }
        type="info"
        showIcon
        style={{ marginBottom: '16px' }}
      />
      <Alert
        message={
          <span>
            Customize your tip page where viewers can send you donations <a>Click here</a>
          </span>
        }
        type="info"
        showIcon
        style={{ marginBottom: '16px' }}
      />
    </div>
  );
}

function AdvancedSettings() {
  return (
    <Form layout={'horizontal'}>
      <SliderInput label={$t('Alert Parries')} min={0} max={30} />
      <CheckboxInput label={$t('Shutdown source when not visible')} />
      <CheckboxInput label={$t('Refresh browser when source become active')} />
      {/*<SwitchInput label={$t('Use custom frame rate')} />*/}
      {/*<NumberInput label={$t('FPS')} />*/}
    </Form>
  );
}

type TVariationId = 'default' | string;

interface IAlertBoxState extends IWidgetState {
  data: {
    settings: {
      alert_delay: 0;
      layout: 'side' | 'banner';
    };
  };
  variations: Record<TAlertType, Record<TVariationId, IVariationSettings>>;
}

export class AlertBoxModule extends WidgetModule<IAlertBoxState> {
  // private getVariationSettings(type: TAlertType): IVariationSettings {
  //   const settings = getDefined(this.state.data).settings;
  //   const variationSettings = {};
  //   Object.keys(settings).map(key => {
  //     if (!key.startsWith(`${type}_`)) return;
  //     const targetKey = key.replace(`${type}_`, '');
  //     variationSettings[targetKey] = settings[key];
  //   });
  //   return variationSettings as IVariationSettings;
  // }

  bind = createBinding(
    () => this.settings,
    statePatch => this.updateSettings(statePatch),
  );

  public switchToLegacyAlertbox() {
    const { SourcesService, CustomizationService } = Services;
    CustomizationService.actions.setSettings({ legacyAlertbox: true });
    SourcesService.actions.showSourceProperties(this.state.sourceId);
  }

  /**
   * @override
   */
  protected patchAfterFetch(data: any): any {
    const settings = data.settings;
    const alertEvents = values(this.eventsInfo) as IAlertInfo[];
    const variationMetadata = getVariationMetadata();
    alertEvents.map(alertEvent => {
      const apiKey = alertEvent.apiKey || alertEvent.type;
      const alertFields = Object.keys(settings).filter(key => key.startsWith(`${apiKey}_`));
      const variationSettings = {} as any;
      alertFields.forEach(key => {
        let value = settings[key];
        const targetKey = key.replace(`${apiKey}_`, '');

        // sanitize settings
        const fieldMetadata = variationMetadata[targetKey];
        if (fieldMetadata) {
          if (fieldMetadata.min !== undefined && value < fieldMetadata.min) {
            value = fieldMetadata.min;
          }
          if (fieldMetadata.max !== undefined && value > fieldMetadata.max) {
            value = fieldMetadata.max;
          }
        }

        settings[key] = value;
        variationSettings[targetKey] = value;
      });
      this.setVariationSettings(alertEvent.type, variationSettings as IVariationSettings);
    });
    return data;
  }

  /**
   * @override
   */
  protected patchBeforeSend(settings: any): any {
    const keys = Object.keys(settings);
    const newSettings = { ...settings };
    keys.forEach(key => {
      if (['alert_delay', 'moderation_delay', 'text_delay'].includes(key)) {
        newSettings[key] = Math.floor(settings[key] / 1000);
      }
    });
    return newSettings;
  }

  public updateVariationSettings(type: TAlertType, variationPatch: Partial<IVariationSettings>) {
    const event = this.eventsInfo[type];
    const apiKey = event.apiKey || event.type;
    const currentVariationSettings = this.state.variations[type].default;
    this.setVariationSettings(type, { ...currentVariationSettings, ...variationPatch });
    const settingsPatch = {} as any;
    Object.keys(variationPatch).forEach(key => {
      settingsPatch[`${apiKey}_${key}`] = variationPatch[key];
    });
    this.updateSettings({ ...this.state.data.settings, ...settingsPatch });
  }

  @mutation()
  private setVariationSettings(type: TAlertType, settings: IVariationSettings) {
    const state = this.state;
    if (!state.variations) state.variations = {} as Record<string, any>;
    if (!state.variations[type]) state.variations[type] = {};
    state.variations[type]['default'] = settings;
  }
}

function useAlertBox() {
  return useWidget<AlertBoxModule>();
}

function getVariationMetadata() {
  return {
    // alert_delay: metadata.slider({ label: $t('Global Alert Delay'), min: 0, max: 30 }),
    alert_duration: metadata.slider({ label: $t('Global Alert Delay'), min: 0, max: 30 }),
    image_href: metadata.text({ label: $t('Image') }),
    sound_href: metadata.text({ label: $t('Sound') }),
    sound_volume: metadata.slider({ label: $t('Sound Volume'), min: 0, max: 100 }),
    message_template: metadata.text({ label: $t('Message Template') }),
    text_delay: metadata.slider({ label: $t('Text Delay'), min: 0, max: 30 }),
  };
}

interface IVariationSettings {
  alert_duration: number;
  image_href: string;
  sound_href: string;
  sound_volume: number;
  message_template: string;
}
