import { GenericTestContext } from 'ava';
import { getClient } from './api-client';
import { IScenesServiceApi } from '../../app/services/scenes/index';
import { WebsocketService } from '../../app/services/websocket';

export async function waitForWidgetSettingsSync(t: GenericTestContext<any>) {
  const apiClient = await getClient();
  const websocketService = apiClient.getResource<WebsocketService>('WebsocketService');

  // waitForEvent() catches only subscribed events
  websocketService.socketEvent.subscribe(() => void 0);

  return await apiClient.waitForEvent((event: Dictionary<any>) => {
    // maybe there is better way to distinguish WidgetEvents, but just check the event type for now
    return (typeof event.type == 'string') && event.type.includes('SettingsUpdate');
  });
}
