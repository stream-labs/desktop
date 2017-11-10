import { Service } from 'services/service';
import { UserService } from 'services/user';
import { Inject } from 'util/injector';
import { HostsService } from 'services/hosts';
import { handleErrors } from 'util/requests';
import io from 'socket.io-client';
import uuid from 'uuid/v4';
import fs from 'fs';
import path from 'path';
import electron from 'electron';
import rimraf from 'rimraf';
import { without } from 'lodash';


interface IStreamlabelActiveSubscriptions {
  filename: string;
  subscribers: string[];
}


/**
 * Returned to streamlabels subscribers.  Contains
 * information about the subscription, and must be
 * passed back when unsubscribing.
 */
export interface IStreamlabelSubscription {
  id: string;
  statname: string;
  path: string;
}


export interface IStreamlabelSettings {
  format: string;
  item_format?: string;
  item_separator?: string;
  limit?: number;
}


export class StreamlabelsService extends Service {

  @Inject() userService: UserService;
  @Inject() hostsService: HostsService;


  /**
   * Represents the raw strings that should be
   * written to the files.
   */
  output: Dictionary<string> = {};

  /**
   * Represents settings which are stored on the server
   */
  settings: Dictionary<IStreamlabelSettings> = {};

  /**
   * Holds info about currently active subscribers
   */
  subscriptions: Dictionary<IStreamlabelActiveSubscriptions> = {};


  init() {
    this.ensureDirectory();
    this.fetchInitialData();
    this.fetchSettings();
    this.initSocketConnection();
  }


  /**
   * Subscribe to a particular streamlabels stat
   * @param statname the stat to subscribe to
   */
  subscribe(statname: string): IStreamlabelSubscription {
    const subscriptionId = uuid();

    if (this.subscriptions[statname]) {
      this.subscriptions[statname].subscribers.push(subscriptionId);
    } else {
      this.subscriptions[statname] = {
        filename: uuid(),
        subscribers: [subscriptionId]
      };

      this.writeFileForStat(statname);
    }

    const subscription: IStreamlabelSubscription = {
      id: subscriptionId,
      path: this.getStreamlabelsPath(this.subscriptions[statname].filename),
      statname
    };

    return subscription;
  }


  /**
   * End a streamlabel subscription
   * @param subscription the subscription object
   */
  unsubscribe(subscription: IStreamlabelSubscription) {
    const subInfo = this.subscriptions[subscription.statname];

    if (!subInfo) return;

    subInfo.subscribers = without(subInfo.subscribers, subscription.id);

    if (subInfo.subscribers.length === 0) {
      delete this.subscriptions[subscription.statname];
    }
  }


  getSettingsForStat(statname: string) {
    const settings = { ...this.settings[statname] };

    if (settings.item_separator) {
      settings.item_separator = settings.item_separator.replace(/\n/gi, '\\n');
    }

    return settings;
  }


  setSettingsForStat(statname: string, settings: IStreamlabelSettings): Promise<boolean> {
    if (settings.item_separator) {
      settings.item_separator = settings.item_separator.replace(/\\n/gi, '\n');
    }

    this.settings[statname] = settings;

    const headers = new Headers();
    headers.append('Content-Type', 'application/json');

    const url = `https://${this.hostsService.streamlabs}/api/v5/slobs/stream-labels` +
    `/settings?token=${this.userService.widgetToken}`;
    const request = new Request(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(this.settings)
    });

    return fetch(request)
      .then(handleErrors)
      .then(() => true);
  }


  private log(message: string, ...args: any[]) {
    console.debug(`Streamlabels: ${message}`, ...args);
  }


  /**
   * Attempt to load initial data via HTTP instead of waiting
   * for a socket event
   */
  private fetchInitialData(): void {
    if (!this.userService.isLoggedIn()) return;

    const url = `https://${this.hostsService.streamlabs}/api/v5/slobs/stream-labels` +
      `/files?token=${this.userService.widgetToken}`;
    const request = new Request(url);

    fetch(request)
      .then(handleErrors)
      .then(response => response.json())
      .then(json => this.updateOutput(json.data));
  }


  private fetchSettings(): void {
    if (!this.userService.isLoggedIn()) return;

    const url = `https://${this.hostsService.streamlabs}/api/v5/slobs/stream-labels` +
      `/settings?token=${this.userService.widgetToken}`;
    const request = new Request(url);

    fetch(request)
      .then(handleErrors)
      .then(response => response.json())
      .then(settings => this.updateSettings(settings));
  }


  private initSocketConnection(): void {
    if (!this.userService.isLoggedIn()) {
      console.warn('User must be logged in for streamlabels socket connection');
      return;
    }

    const url = `https://${this.hostsService.streamlabs}/api/v5/slobs/socket-token/${this.userService.widgetToken}`;
    const request = new Request(url);

    fetch(request)
      .then(handleErrors)
      .then(response => response.json())
      .then(json => json.socket_token)
      .then(token => {
        const url = `https://aws-io.${this.hostsService.streamlabs}?token=${token}`;
        const socket = io(url, { transports: ['websocket'] });

        // These are useful for debugging
        socket.on('connect', () => this.log('Connection Opened'));
        socket.on('connect_error', (e: any) => this.log('Connection Error', e));
        socket.on('connect_timeout', () => this.log('Connection Timeout'));
        socket.on('error', () => this.log('Error'));
        socket.on('disconnect', () => this.log('Connection Closed'));

        socket.on('event', (e: any) => this.onSocketEvent(e));
      });
  }


  // TODO: Interface for socket events
  private onSocketEvent(event: any) {
    if (event.type === 'streamlabels') {
      this.updateOutput(event.message.data);
    }
  }



  private ensureDirectory() {
    if (fs.existsSync(this.streamlabelsDirectory)) {
      rimraf.sync(this.streamlabelsDirectory);
    }

    fs.mkdirSync(this.streamlabelsDirectory);
  }


  private get streamlabelsDirectory() {
    return path.join(electron.remote.app.getPath('userData'), 'Streamlabels');
  }


  private getStreamlabelsPath(filename: string) {
    return path.join(this.streamlabelsDirectory, `${filename}.txt`);
  }

  /**
   * Applies a patch to the settings object
   * @param settingsPatch the new settings to be applied
   */
  private updateSettings(settingsPatch: Dictionary<IStreamlabelSettings>) {
    this.settings = {
      ...this.settings,
      ...settingsPatch
    };
  }


  /**
   * Applies a patch to the output object and writes files for
   * the newly updated outputs.
   * @param outputPatch the new output strings
   */
  private updateOutput(outputPatch: Dictionary<string>) {
    this.output = {
      ...this.output,
      ...outputPatch
    };

    Object.keys(outputPatch).forEach(stat => this.writeFileForStat(stat));
  }


  /**
   * Writes data for a particular stat.  Will not do anything
   * if there is no data available for that stat, or if there
   * are no subscribers for that particular stat.
   */
  private writeFileForStat(statname: string) {
    if (this.output[statname] == null) return;
    if (this.subscriptions[statname] == null) return;

    electron.ipcRenderer.send('streamlabels-writeFile', {
      path: this.getStreamlabelsPath(this.subscriptions[statname].filename),
      data: this.output[statname]
    });
  }

}
