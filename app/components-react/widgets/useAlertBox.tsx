import {
  createAlertsMap,
  ICustomCode,
  ICustomField,
  IWidgetState,
  useWidget,
  WidgetModule,
} from './common/useWidget';
import { values, cloneDeep, pick } from 'lodash';
import { IAlertConfig, TAlertType } from '../../services/widgets/widget-config';
import { createBinding } from '../shared/inputs';
import { Services } from '../service-provider';
import { mutation } from '../store';
import { metadata } from '../shared/inputs/metadata';
import { $t } from '../../services/i18n';
import * as electron from 'electron';
import { getDefined } from '../../util/properties-type-guards';

interface IAlertBoxState extends IWidgetState {
  data: {
    settings: {
      alert_delay: 0;
      bit_variations: any;
    };
    variations: TVariationsState;
  };
  availableAlerts: TAlertType[];
}

/**
 * A Redux module for AlertBox components
 */
export class AlertBoxModule extends WidgetModule<IAlertBoxState> {
  /**
   * config for all events supported by users' platforms
   */
  get alerts() {
    return this.state.availableAlerts.map(alertType => this.eventsConfig[alertType]);
  }

  /**
   * metadata for the general settings form
   */
  private generalMetadata = getGeneralSettingsMetadata();

  /**
   * metadata for the variation settings form
   */
  private variationsMetadata = getVariationsMetadata();

  /**
   * returns settings for a given variation from the state
   */
  getVariationSettings<T extends TAlertType>(alertType: T, variationId = 'default') {
    return this.state.data.variations[alertType][variationId];
  }

  /**
   * 2-way bindings for general settings inputs
   */
  bind = createBinding(
    // define source of values
    () => this.settings,
    // define onChange handler
    statePatch => this.updateSettings(statePatch),
  );

  /**
   * 2-way bindings for variation settings inputs
   */
  createVariationBinding<T extends TAlertType>(
    alertType: T,
    variationId = 'default',
    forceUpdate: () => unknown,
  ) {
    return createBinding<TVariationsSettings[T]>(
      // define source of values
      () => this.getVariationSettings(alertType, variationId) as TVariationsSettings[T],
      // define onChange handler
      newSettings => {
        this.updateVariationSettings(alertType, variationId, newSettings);
        forceUpdate();
      },
      // pull additional metadata like tooltip, label, min, max, etc...
      fieldName => this.variationsMetadata[alertType as any][fieldName],
    );
  }

  /**
   * enable or disable an alert
   */
  setEnabled(type: TAlertType, enabled: boolean) {
    this.updateVariationSettings(type, 'default', { enabled });
  }

  /**
   * list of enabled alerts
   */
  get enabledAlerts() {
    return Object.keys(this.state.data.variations).filter(
      alertType => this.state.data.variations[alertType].default.enabled,
    );
  }

  /**
   * Switch UI to a legacy alertbox
   */
  public switchToLegacyAlertbox() {
    const { SourcesService, CustomizationService } = Services;
    CustomizationService.actions.setSettings({ legacyAlertbox: true });
    SourcesService.actions.showSourceProperties(this.state.sourceId);
  }

  /**
   * @override
   * Patch and sanitize the AlertBox settings after fetching data from the server
   */
  protected patchAfterFetch(data: any): any {
    const settings = data.settings;


    // sanitize general settings
    Object.keys(settings).forEach(key => {
      settings[key] = this.sanitizeValue(settings[key], this.generalMetadata[key]);
    });

    return data;
  }

  /**
   * @override
   */
  setData(data: IAlertBoxState['data']) {
    // save widget data instate and calculate additional state variables
    super.setData(data);
    const settings = data.settings;
    const allAlerts = values(this.eventsConfig) as IAlertConfig[];

    // group alertbox settings by alert types and store them in `state.data.variations`
    allAlerts.map(alertEvent => {
      const apiKey = alertEvent.apiKey || alertEvent.type;
      const alertFields = Object.keys(settings).filter(key => key.startsWith(`${apiKey}_`));
      const variationSettings = {} as any;
      alertFields.forEach(key => {
        let value = settings[key];
        const targetKey = key.replace(`${apiKey}_`, '');

        // sanitize the variation value
        value = this.sanitizeValue(value, this.variationsMetadata[alertEvent.type][targetKey]);

        settings[key] = value;
        variationSettings[targetKey] = value;
      });
      this.setVariationSettings(alertEvent.type, 'default', variationSettings as any);
    });

    // define available alerts
    const availableAlerts = allAlerts
      .filter(alertConfig => this.state.data.variations[alertConfig.type])
      .map(alertConfig => alertConfig.type);
    this.setAvailableAlerts(availableAlerts);
  }

  /**
   * The AlertBox backend saves some setting in a different format
   * Patch them before sending the request to the server
   */
  protected patchBeforeSend(settings: any): any {
    const keys = Object.keys(settings);
    const newSettings = { ...settings };
    keys.forEach(key => {
      if (['alert_delay', 'moderation_delay', 'text_delay', 'alert_duration'].includes(key)) {
        newSettings[key] = Math.floor(settings[key] / 1000);
      }
    });
    return newSettings;
  }

  sanitizeValue(value: any, fieldMetadata: Record<string, any>) {
    if (fieldMetadata) {
      // fix Min and Max values
      if (fieldMetadata.min !== undefined && value < fieldMetadata.min) {
        return fieldMetadata.min;
      }
      if (fieldMetadata.max !== undefined && value > fieldMetadata.max) {
        return fieldMetadata.max;
      }
    }
    return value;
  }

  /**
   * Update variation settings and sync them with the server
   */
  public updateVariationSettings(
    type: TAlertType,
    variationId: string,
    variationPatch: Partial<TVariationsSettings[TAlertType]>,
  ) {
    const event = this.eventsConfig[type];
    const apiKey = event.apiKey || event.type;
    const currentVariationSettings = this.getVariationSettings(type);

    // save current settings to the state
    const newVariationSettings = {
      ...currentVariationSettings,
      ...variationPatch,
    };
    this.setVariationSettings(type, variationId, newVariationSettings);

    // flatten settings by adding prefixes
    const settingsPatch = {} as any;
    Object.keys(variationPatch).forEach(key => {
      settingsPatch[`${apiKey}_${key}`] = variationPatch[key];
    });

    // set the same message template for all Cheer variations
    if (type === 'cheer') {
      const newBitsVariations = this.state.data.settings.bit_variations.map((variation: any) => {
        const newVariation = cloneDeep(variation);
        newVariation.settings.text.format = newVariationSettings.message_template;
        return newVariation;
      });
      settingsPatch.bit_variations = newBitsVariations;
    }

    // save flatten setting in store and save them on the server
    this.updateSettings({ ...this.state.data.settings, ...settingsPatch });
  }

  openAlertInfo(alertType: TAlertType) {
    const url = getDefined(this.eventsConfig[alertType].tooltipLink);
    electron.remote.shell.openExternal(url);
  }

  get selectedAlert(): TAlertType | null {
    const selectedTab = this.state.selectedTab;
    if (this.eventsConfig[selectedTab]) {
      return selectedTab as TAlertType;
    }
    return null;
  }

  /**
   * @override
   */
  get customCode() {
    // get custom code from the selected variation
    if (!this.selectedAlert) return null;
    const variationSettings = this.getVariationSettings(this.selectedAlert);
    const {
      custom_html_enabled,
      custom_html,
      custom_css,
      custom_js,
      custom_json,
    } = variationSettings;
    return {
      custom_enabled: custom_html_enabled,
      custom_css,
      custom_js,
      custom_html,
      custom_json,
    };
  }

  /**
   * @override
   */
  updateCustomCode(patch: Partial<ICustomCode>) {
    // save custom code from the selected variation
    const selectedAlert = getDefined(this.selectedAlert);
    const newPatch = cloneDeep(patch) as Partial<ICustomCode> & { custom_html_enabled?: boolean };
    if (newPatch.custom_enabled !== undefined) {
      newPatch.custom_html_enabled = patch.custom_enabled;
      delete newPatch.custom_enabled;
    }
    this.updateVariationSettings(selectedAlert, 'default', newPatch);
  }

  /**
   * Save the variation settings in store
   */
  @mutation()
  private setVariationSettings(
    type: TAlertType,
    variationId: string,
    settings: TVariationsSettings[TAlertType],
  ) {
    const state = this.state;
    if (!state.data.variations) state.data.variations = {} as any;
    if (!state.data.variations[type]) state.data.variations[type] = {} as any;
    state.data.variations[type][variationId] = settings;
  }

  @mutation()
  private setAvailableAlerts(alerts: TAlertType[]) {
    this.state.availableAlerts = alerts;
  }
}

/**
 * Hook for using the AlertBox module in components
 */
export function useAlertBox() {
  return useWidget<AlertBoxModule>();
}

/**
 * Returns metadata for the general settings form
 */
function getGeneralSettingsMetadata() {
  return {
    alert_delay: metadata.seconds({
      label: $t('Global Alert Delay'),
      max: 30000,
    }),
    interrupt_mode_delay: {
      min: 0,
      max: 20000,
    },
  };
}

/**
 * Returns metadata for the variation settings form
 */
function getVariationsMetadata() {
  // define common metadata for all variations
  const commonMetadata = {
    alert_duration: metadata.seconds({
      label: $t('Alert Duration'),
      max: 30000,
      tooltip: $t('How many seconds to show this alert before hiding it'),
    }),
    image_href: metadata.text({ label: $t('Image') }),
    sound_href: metadata.text({ label: $t('Sound') }),
    sound_volume: metadata.slider({ label: $t('Sound Volume'), min: 0, max: 100 }),
    message_template: metadata.text({ label: $t('Message Template') }),
    layout: metadata.list<'banner' | 'above' | 'side'>({ label: $t('Layout') }),
    text_delay: metadata.seconds({
      label: $t('Text Delay'),
      max: 60000,
      tooltip: $t(
        'How many seconds after your image/video/audios to show the alert text. This is useful if you want to wait a few seconds for an animation to finish before your alert text appears.',
      ),
    }),
    enabled: metadata.bool({}),
    custom_html_enabled: metadata.bool({}),
    custom_html: metadata.text({}),
    custom_css: metadata.text({}),
    custom_js: metadata.text({}),
    custom_json: metadata.any({}),
  };

  // define unique metadata for each variation
  const specificMetadata = createAlertsMap({
    donation: {
      message_template: metadata.text({
        label: $t('Message Template'),
        tooltip:
          $t('When a donation alert shows up, this will be the format of the message.') +
          '\n' +
          $t('Available Tokens: ') +
          ' {name} ' +
          $t('The name of the donator') +
          ' {amount} ' +
          $t('The amount that was donated'),
      }),

      alert_message_min_amount: metadata.number({
        label: $t('Min. Amount to Trigger Alert'),
        min: 0,
      }),
    },
    follow: {},
    raid: {},
    host: {},
    subscription: {},
    cheer: {},
    ytSuperchat: {},
    fbStars: {},
    fbSupport: {},
    fbLike: {},
  });

  // mix common and specific metadata and return it
  Object.keys(specificMetadata).forEach(alertType => {
    specificMetadata[alertType] = { ...commonMetadata, ...specificMetadata[alertType] };
  });
  return specificMetadata as {
    [key in keyof typeof specificMetadata]: typeof specificMetadata[key] & typeof commonMetadata;
  };
}

// DEFINE HELPER TYPES

/**
 * A type for metadata object
 */
type TVariationsMetadata = ReturnType<typeof getVariationsMetadata>;

/**
 * A type for alert settings
 *
 * {
 *   donation: {
 *     alert_duration: number;
 *     image_href: string;
 *     ...
 *   },
 *   follow: {
 *     ...
 *   }
 *   ...
 * }
 *
 */
type TVariationsSettings = {
  [fieldName in keyof TVariationsMetadata]: PickValues<TVariationsMetadata[fieldName]>;
};

/**
 * A type for variation settings grouped by variations
 *
 * {
 *   donation: {
 *     default: {
 *       alert_duration: number;
 *       image_href: string;
 *       ...
 *     }
 *     default001: {
 *       ...
 *     }
 *   },
 *   ...
 * }
 *
 */
type TVariationsState = {
  [fieldName in keyof TVariationsSettings]: Record<string, TVariationsSettings[fieldName]>;
};

// helper utils
type PickValue<T> = T extends { value?: infer TValue } ? TValue : never;
type PickValues<T> = {
  [fieldName in keyof T]: PickValue<T[fieldName]>;
};
