import { GenericTestContext } from 'ava';
import { getClient } from '../helpers/api-client';
import { IScenesServiceApi } from '../../app/services/scenes';
import { WebsocketService } from '../../app/services/websocket';

export async function waitForWidgetSettingsSync(t: GenericTestContext<any>) {
  const apiClient = await getClient();
  const websocketService = apiClient.getResource<WebsocketService>('WebsocketService');

  // waitForEvent() catches only subscribed events
  websocketService.socketEvent.subscribe(() => void 0);

  return await apiClient.waitForEvent((event: Dictionary<any>) => {
    console.log('caught an event', event);
    return event.type && event.type.contains('SettingsUpdate'); // maybe there is better way to distinguish WidgetEvents
  });
}
