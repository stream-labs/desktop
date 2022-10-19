import React from 'react';
import { IWidgetCommonState, WidgetModule } from './common/useWidget';
import { WidgetLayout } from './common/WidgetLayout';

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
  return (
    <WidgetLayout>
      <></>
    </WidgetLayout>
  );
}

export class CustomWidgetModule extends WidgetModule<ICustomWidgetState> {
  patchAfterFetch(data: any): ICustomWidgetState {
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
