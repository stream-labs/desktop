import { getClient } from './api-client';
import { WebsocketService } from '../../app/services/websocket';
import { sleep } from './sleep';
import { focusChild, TExecutionContext } from './spectron';
import { Observable, Subject } from 'rxjs';
import { first } from 'rxjs/operators';
import { WidgetsService, WidgetType } from '../../app/services/widgets';
import { SourcesService } from '../../app/services/sources';

// returns SettingsUpdate event listener
async function getListener(): Promise<Observable<any>> {
  const apiClient = await getClient();
  const websocketService = apiClient.getResource<WebsocketService>('WebsocketService');
  const listener = new Subject();

  // listen all websocket events and filter SettingsUpdate event
  websocketService.socketEvent.subscribe((event: Dictionary<any>) => {
    if (typeof event.type === 'string' && event.type.includes('SettingsUpdate')) {
      listener.next(event);
    }
  });

  return listener;
}

export async function waitForWidgetSettingsSync(t: TExecutionContext, fn: Function) {
  return new Promise(async (resolve, reject) => {
    // start listen widgets SettingsUpdate events
    const listener = await getListener();

    // execute code
    await fn();

    // catching events for 15s
    listener.pipe(first()).subscribe(ev => resolve(ev));
    await sleep(15000);

    reject('No widget events received');
  });
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
  await t.context.app.client.waitForVisible('button=Widget Editor'); // wait for loading
}
