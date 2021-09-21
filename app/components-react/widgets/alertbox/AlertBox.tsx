import React from 'react';
import {
  CheckboxInput,
  createBinding,
  FileInput,
  ListInput,
  MediaGalleryInput,
  SliderInput,
  TextInput,
} from '../../shared/inputs';
import { $t } from '../../../services/i18n';
import { alertNameMap } from '../../../services/widgets/settings/alert-box/alert-box-data';
import { Alert, Button, Collapse, Layout, Menu, Tooltip } from 'antd';
import { DEFAULT_WIDGET_STATE, IWidgetState, useWidget, WidgetModule } from '../useWidget';
import Form from '../../shared/inputs/Form';
import { WidgetLayout } from '../WidgetLayout';
import { CaretRightOutlined, CloseOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { Services } from '../../service-provider';
import { values } from 'lodash';
import { IAlertInfo, TAlertType } from '../../../services/widgets/widget-settings';
import { getDefined } from '../../../util/properties-type-guards';
import { mutation, useSelector } from '../../store';

export function AlertBox() {
  return (
    <WidgetLayout>
      <MainPanel />
      <SubPanel />
    </WidgetLayout>
  );
}

function MainPanel() {
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

function SubPanel() {
  const { selectedTab } = useAlertBox();
  const tab = selectedTab || 'general';
  if (tab === 'general') {
    return <GeneralSettings />;
  } else if (tab === 'advanced') {
    return <AdvancedSettings />;
  } else {
    return <VariationSettings type={tab as TAlertType} />;
  }
}

function GeneralSettings() {
  const { switchToLegacyAlertbox, bind } = useAlertBox();
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
    </Form>
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
      {p.type === 'donation' && (
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
      )}
      <MediaGalleryInput label={$t('Image')} value={imageUrl} />
      <FileInput label={$t('Sound')} />
      <SliderInput label={$t('Sound Volume')} {...bind.sound_volume} min={0} max={100} />
      <TextInput label={$t('Message Template')} {...bind.message_template} />
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
    alertEvents.map(alertEvent => {
      const alertType = alertEvent.type;
      const alertFields = Object.keys(settings).filter(key => key.startsWith(`${alertType}_`));
      const variationSettings = {} as any;
      alertFields.forEach(key => {
        const targetKey = key.replace(`${alertType}_`, '');
        variationSettings[targetKey] = settings[key];
      });
      this.setVariationSettings(alertType, variationSettings as IVariationSettings);
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
      if (['alert_delay', 'moderation_delay'].includes(key)) {
        newSettings[key] = Math.floor(settings[key] / 1000);
      }
    });
    return newSettings;
  }

  public updateVariationSettings(type: TAlertType, variationPatch: Partial<IVariationSettings>) {
    const currentVariationSettings = this.state.variations[type].default;
    this.setVariationSettings(type, { ...currentVariationSettings, ...variationPatch });
    const settingsPatch = {} as any;
    Object.keys(variationPatch).forEach(key => {
      settingsPatch[`${type}_${key}`] = variationPatch[key];
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

interface IVariationSettings {
  alert_duration: number;
  image_href: string;
  sound_href: string;
  sound_volume: number;
  message_template: string;
}
