import React from 'react';
import { useOnCreate } from '../hooks';
import { ModalLayout } from '../shared/ModalLayout';
import { Services } from '../service-provider';
import { AlertBox } from './alertbox/AlertBox';
import { AlertBoxModule } from './alertbox/useAlertBox';
import { useWidgetRoot } from './useWidget';
import { getDefined } from '../../util/properties-type-guards';
// TODO: import other widgets here to avoid merge conflicts
// BitGoal
// DonationGoal
// CharityGoal
// FollowerGoal
// StarsGoal
// SubGoal
// SubscriberGoal
// ChatBox
// ChatHighlight
// Credits
// DonationTicker
// EmoteWall
// EventList
// MediaShare
// Poll
// SpinWheel
// SponsorBanner
// StreamBoss
// TipJar
import { ViewerCount, ViewerCountModule } from './ViewerCount';

// define list of Widget components and modules
export const components = {
  AlertBox: [AlertBox, AlertBoxModule],
  // TODO: define other widgets here to avoid merge conflicts
  // BitGoal
  // DonationGoal
  // CharityGoal
  // FollowerGoal
  // StarsGoal
  // SubGoal
  // SubscriberGoal
  // ChatBox
  // ChatHighlight
  // Credits
  // DonationTicker
  // EmoteWall
  // EventList
  // MediaShare
  // Poll
  // SpinWheel
  // SponsorBanner
  // StreamBoss
  // TipJar
  ViewerCount: [ViewerCount, ViewerCountModule],
};

/**
 * Renders a widget window by given sourceId from window's query params
 */
export function WidgetWindow() {
  // take the source id and widget's component from the window's params
  const { sourceId, WidgetModule, WidgetSettingsComponent } = useOnCreate(() => {
    const { WindowsService } = Services;
    const { sourceId, widgetType } = getDefined(WindowsService.state.child.queryParams);
    const [WidgetSettingsComponent, WidgetModule] = components[widgetType];
    return { sourceId, WidgetModule, WidgetSettingsComponent };
  });

  // initialize the Redux module for the widget
  // so all children components can use it via `useWidget()` call
  useWidgetRoot(WidgetModule, sourceId);

  return (
    <ModalLayout bodyStyle={{ padding: '0px' }} hideFooter={true}>
      <WidgetSettingsComponent />
    </ModalLayout>
  );
}
