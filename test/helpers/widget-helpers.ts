import { getClient } from './api-client';
import { WebsocketService } from '../../app/services/websocket';
import { sleep } from './sleep';
import { TExecutionContext } from './spectron';

export async function waitForWidgetSettingsSync(t: TExecutionContext) {
  const apiClient = await getClient();
  const websocketService = apiClient.getResource<WebsocketService>('WebsocketService');

  // waitForEvent() catches only subscribed events
  websocketService.socketEvent.subscribe(() => void 0);

  // check that we receive a socket event with new widget settings
  await apiClient.waitForEvent((event: Dictionary<any>) => {
    // maybe there is better way to distinguish WidgetEvents, but just check the event type for now
    return typeof event.type == 'string' && event.type.includes('SettingsUpdate');
  });
  // WidgetSettings component has Debouncing for the saving method, so wait a bit
  await sleep(1000);
}
