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


export interface IStreamlabelsData {
  [label: string]: string;
}


export interface IStreamlabelsSubscription {
  filename: string;
  statname: string;
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


  data: IStreamlabelsData;
  settings: Dictionary<IStreamlabelSettings>;
  subscriptions: IStreamlabelsSubscription[] = [];


  init() {
    this.ensureDirectory();
    this.fetchInitialData();
    this.fetchSettings().then(settings => this.settings = settings);
    this.fetchSocketToken().then(token => {
      const url = `https://aws-io.${this.hostsService.streamlabs}?token=${token}`;
      const socket = io(url, { transports: ['websocket'] });

      // These are useful for debugging
      socket.on('connect', () => this.log('Connection Opened'));
      socket.on('connect_error', (e: any) => this.log('Connection Error', e));
      socket.on('connect_timeout', () => this.log('Connection Timeout'));
      socket.on('error', () => this.log('Error'));
      socket.on('disconnect', () => this.log('Connection Closed'));

      socket.on('event', (e: any) => {
        if (e.type === 'streamlabels') {
          this.setStreamlabelsData(e.message.data);
        }
      });
    });
  }


  log(message: string, ...args: any[]) {
    console.log(`Streamlabels: ${message}`, ...args);
  }


  subscribe(statname: string): string {
    const filename = uuid();

    const subscription: IStreamlabelsSubscription = { filename, statname };
    this.subscriptions.push(subscription);
    this.updateSubscription(subscription);

    return filename;
  }


  unsubscribe(filename: string) {
    this.subscriptions = this.subscriptions.filter(subscription => {
      return subscription.filename !== filename;
    });
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


  /**
   * Attempt to load initial data via HTTP instead of waiting
   * for a socket event
   */
  fetchInitialData() {
    if (!this.userService.isLoggedIn()) return;

    const url = `https://${this.hostsService.streamlabs}/api/v5/slobs/stream-labels` +
      `/files?token=${this.userService.widgetToken}`;
    const request = new Request(url);

    return fetch(request)
      .then(handleErrors)
      .then(response => response.json())
      .then(json => this.setStreamlabelsData(json.data));
  }


  fetchSettings(): Promise<Dictionary<IStreamlabelSettings>> {
    if (!this.userService.isLoggedIn()) return Promise.reject({});

    const url = `https://${this.hostsService.streamlabs}/api/v5/slobs/stream-labels` +
      `/settings?token=${this.userService.widgetToken}`;
    const request = new Request(url);

    return fetch(request)
      .then(handleErrors)
      .then(response => response.json());
  }


  fetchSocketToken(): Promise<string> {
    if (!this.userService.isLoggedIn()) return Promise.reject('User must be logged in');

    const url = `https://${this.hostsService.streamlabs}/api/v5/slobs/socket-token/${this.userService.widgetToken}`;
    const request = new Request(url);

    return fetch(request)
      .then(handleErrors)
      .then(response => response.json())
      .then(json => json.socket_token);
  }


  setStreamlabelsData(data: IStreamlabelsData) {
    this.data = { ...data };

    this.subscriptions.forEach(subscription => this.updateSubscription(subscription));
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


  getStreamlabelsPath(filename: string) {
    return path.join(this.streamlabelsDirectory, `${filename}.txt`);
  }


  /**
   * Updates the data in a single streamlabels file
   * @param filename the filename
   * @param statname the name of the stat
   */
  updateSubscription(subscription: IStreamlabelsSubscription) {
    if (!this.data) return;

    console.log('Writing file', subscription.filename, subscription.statname);

    electron.ipcRenderer.send('streamlabels-writeFile', {
      path: this.getStreamlabelsPath(subscription.filename),
      data: this.data[subscription.statname]
    });
  }

}
