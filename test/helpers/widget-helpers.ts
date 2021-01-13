import { sleep } from './sleep';
import { focusChild, TExecutionContext } from './spectron';
import { WidgetsService, WidgetType } from '../../app/services/widgets';
import { SourcesService } from '../../app/services/sources';
import { getClient } from './api-client';

export async function waitForWidgetSettingsSync(t: TExecutionContext) {
  await sleep(2000);
  await (await t.context.app.client.$('.saving-indicator')).waitForDisplayed({
    timeout: 15000,
    reverse: true,
  });
  await sleep(2000);
}

export enum EWidgetType {
  AlertBox = 0,
  DonationGoal = 1,
  FollowerGoal = 2,
  SubscriberGoal = 3,
  BitGoal = 4,
  DonationTicker = 5,
  ChatBox = 6,
  EventList = 7,
  TipJar = 8,
  ViewerCount = 9,
  StreamBoss = 10,
  Credits = 11,
  SpinWheel = 12,
  SponsorBanner = 13,
  MediaShare = 14,
  SubGoal = 15,
}

/**
 * Add a widget and open the props window
 */
export async function addWidget(t: TExecutionContext, type: EWidgetType, name: string) {
  const api = await getClient();
  const widgetService = api.getResource<WidgetsService>('WidgetsService');
  const sourcesService = api.getResource<SourcesService>('SourcesService');

  const widget = widgetService.createWidget((type as unknown) as WidgetType, name);
  sourcesService.showSourceProperties(widget.sourceId);
  await focusChild(t);
  await (await t.context.app.client.$('button=Widget Editor')).waitForDisplayed(); // wait for loading
}
