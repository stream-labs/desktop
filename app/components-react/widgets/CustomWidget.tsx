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

export class CustomWidgetModule extends WidgetModule<ICustomWidgetState> {}
