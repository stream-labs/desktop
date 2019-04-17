import { getClient } from './api-client';
import { WebsocketService } from '../../app/services/websocket';
import { sleep } from './sleep';
import { TExecutionContext } from './spectron';
import { Observable, Subject } from 'rxjs';
import { filter, first } from 'rxjs/operators';

let listener: Subject<any>;

// return an existing SettingsUpdate listener or create one
async function getListener(): Promise<Observable<any>> {
  if (listener) return listener;

  const apiClient = await getClient();
  const websocketService = apiClient.getResource<WebsocketService>('WebsocketService');
  listener = new Subject();

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

    // catching events for 5s
    listener.pipe(first()).subscribe(ev => resolve(ev));
    await sleep(5000);

    reject('No widget events received');
  });
}
