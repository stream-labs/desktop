import React from 'react';
import { IWidgetCommonState, useWidget, WidgetModule } from './common/useWidget';
import { WidgetLayout } from './common/WidgetLayout';
import InputWrapper from '../shared/inputs/InputWrapper';
import { $t } from '../../services/i18n';
import { CheckboxInput, ColorInput, FontFamilyInput, FontSizeInput } from '../shared/inputs';

interface ICustomWidgetState extends IWidgetCommonState {
  data: {
    settings: {
      custom_enabled: false;
      custom_html: '';
      custom_css: '';
      custom_js: '';
      custom_json: null;
    };
  };
}

export function CustomWidget() {
  const { isLoading, bind } = useCustomWidget();
  // use 1 column layout
  console.log('isLoading ', isLoading);
  // return <WidgetLayout>{!isLoading && <>{'Custom Widget'}</>}</WidgetLayout>;
  return <WidgetLayout>{!isLoading && <>{'Custom Widget Settings'}</>}</WidgetLayout>;
}

export class CustomWidgetModule extends WidgetModule<ICustomWidgetState> {
  patchAfterFetch(data: any): ICustomWidgetState {
    // transform platform types to simple booleans
    console.log('data ', data);
    return {
      ...data,
      settings: {
        ...data.settings,
        custom_enabled: data.settings.custom_enabled,
        custom_html: data.settings.custom_html,
        custom_css: data.settings.custom_css,
        custom_js: data.settings.custom_js,
        custom_json: data.settings.custom_json,
      },
    };
  }

  patchBeforeSend(settings: ICustomWidgetState['data']['settings']): any {
    // the API accepts an object instead of simple booleans for platforms
    console.log('settings ', settings);
    return {
      ...settings,
      custom_enabled: settings.custom_enabled,
      custom_html: settings.custom_html,
      custom_css: settings.custom_css,
      custom_js: settings.custom_js,
      custom_json: settings.custom_json,
    };
  }
}

function useCustomWidget() {
  return useWidget<CustomWidgetModule>();
}
