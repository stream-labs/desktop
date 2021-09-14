import React from 'react';
import { useOnCreate } from '../hooks';
import { ModalLayout } from '../shared/ModalLayout';
import { Services } from '../service-provider';
import { AlertBox, AlertBoxModule } from './alertbox/AlertBox';
import { useWidget, useWidgetRoot } from './useWidget';
import { getDefined } from '../../util/properties-type-guards';
import { ListInput } from '../shared/inputs';
import { Form } from 'antd';

export const components = {
  AlertBox: [AlertBox, AlertBoxModule],
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
    <ModalLayout bodyStyle={{ padding: '0px' }} footer={null}>
      <WidgetSettingsComponent />
    </ModalLayout>
  );
}

// function Footer() {
//   const { layout, setLayout } = useWidget();
//   return (
//     <Form>
//       <ListInput
//         options={[
//           { label: 'side', value: 'side' },
//           { label: 'bottom', value: 'bottom' },
//         ]}
//         value={layout}
//         onChange={setLayout}
//       />
//     </Form>
//   );
// }
