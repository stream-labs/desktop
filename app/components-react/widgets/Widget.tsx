import React from 'react';
import { useOnCreate } from '../hooks';
import { ModalLayout } from '../shared/ModalLayout';
import { Services } from '../service-provider';
import { AlertBox, AlertBoxModule } from './alertbox/AlertBox';
import { useWidgetRoot } from './useWidget';
import { getDefined } from '../../util/properties-type-guards';
import { ViewerCount, ViewerCountModule } from './ViewerCount';

export const components = {
  AlertBox: [AlertBox, AlertBoxModule],
  ViewerCount: [ViewerCount, ViewerCountModule],
};

export function WidgetWindow() {
  // take the source id and widget type from the window params
  const { sourceId, WidgetModule, WidgetSettingsComponent } = useOnCreate(() => {
    const { WindowsService } = Services;
    const { sourceId, widgetType } = getDefined(WindowsService.state.child.queryParams);
    const [WidgetSettingsComponent, WidgetModule] = components[widgetType];
    return { sourceId, WidgetModule, WidgetSettingsComponent };
  });

  useWidgetRoot(WidgetModule, sourceId);

  return (
    <ModalLayout bodyStyle={{ padding: '0px' }} hideFooter={true}>
      <WidgetSettingsComponent />
    </ModalLayout>
  );
}
