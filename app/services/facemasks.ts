import Vue from 'vue';
import { PersistentStatefulService } from './persistent-stateful-service';
import { UserService } from 'services/user';
import { HostsService } from './hosts';
import { SourcesService } from './sources';
import { Inject } from '../util/injector';
import { handleErrors, authorizedHeaders } from 'util/requests';
import { mutation } from './stateful-service';
import * as obs from './obs-api';
import path from 'path';
import fs from 'fs';
import https from 'https';
import electron from 'electron';
import { WebsocketService, TSocketEvent } from 'services/websocket';
import { ProfanityFilterService } from '../util/profanity';

interface IFacemasksServiceState {
  devices: Dictionary<string>;
  modtimeMap: Dictionary<number>;
}

interface IInputDeviceSelection {
  name: string;
  value: string;
  selected?: boolean;
}

interface IFacemask {
  modtime: number;
  uuid: string;
}

interface IFacemaskAlert {
  uuid: string;
}

interface IProfanitySettings {
  profanity_custom_words: string;
  profanity_default_words: boolean;
  profanity_mode: number;
  profanity_names: boolean;
}

interface IFacemaskSettings {
  enabled: boolean;
  initialized: boolean;
  facemasks: Dictionary<number>;
  transitions_enabled: boolean;
  transition: Dictionary<string>;
  duration: number;
  data?: IFacemask[];
  devices?: IInputDeviceSelection[];
}

export class FacemasksService extends PersistentStatefulService<IFacemasksServiceState> {
  @Inject() userService: UserService;
  @Inject() hostsService: HostsService;
  @Inject() websocketService: WebsocketService;
  @Inject() profanityFilterService: ProfanityFilterService;
  @Inject() sourcesService: SourcesService;

  cdn = 'https://facemasks-cdn.streamlabs.com/';
  active = false;
  enabled = false;
  initialized  = false;
  queue:IFacemaskAlert[] = [];
  profanitySettings:IProfanitySettings = {
    profanity_custom_words: '',
    profanity_default_words: true,
    profanity_mode: 1,
    profanity_names: true,
  };

  init() {
    super.init();
    this.getStatus();
    this.testSources();
    if (this.userService.isLoggedIn()) {
      this.startup();
    }
    this.userService.userLogin.subscribe(() => {
      this.startup();
    });
  }

  get apiToken() {
    return this.userService.apiToken;
  }

  testSources() {
    const sources = this.sourcesService.getSources();
    console.log(this.sourcesService.getSources());
    let videoInput = null;
    sources.forEach(source => {
      if (source.type === 'dshow_input') {
        videoInput = source;
      }
    });
    console.log(videoInput);
    const obs = videoInput.getObsInput();
    const fm = obs.filters[0];
    fm.update({ demoMode: true });
    console.log(obs, fm);
  }

  private initSocketConnection(): void {
    this.websocketService.socketEvent.subscribe(e => this.onSocketEvent(e));
  }

  startQueueListener() {

  }

  endQueueListener() {

  }

  onSocketEvent(event: TSocketEvent) {
    console.log(event);
    if (event.type === 'facemask') {
      console.log('yes');
    }
  }

  profanitize(message: string, name: string) {
    const custom_words_list = this.profanitySettings.profanity_custom_words.trim();
    const custom_words = custom_words_list.length ? custom_words_list.replace(/\s\s+/g, ' ').split(' ') : [];
    const custom_words_regex = custom_words.length ? this.profanityFilterService.getListRegex(custom_words) : null;

    let hasProfanity = false;

    try {
      if (this.profanitySettings.profanity_names) {
        const namePres = this.profanityFilterService.processString(name, {
          extraRegex: custom_words_regex,
          useDefaultRegex: this.profanitySettings.profanity_default_words,
          isName: true,
        });

        name = namePres[0];
      }

      // Replace bad word characters with *
      if (this.profanitySettings.profanity_mode === 1) {
        const pres = this.profanityFilterService.processString(message, {
          extraRegex: custom_words_regex,
          useDefaultRegex: this.profanitySettings.profanity_default_words,
          replace: false,
        });
        message = pres[0];
        hasProfanity = pres[1];
      // Replace bad words with happy words
      } else if (this.profanitySettings.profanity_mode === 2) {
        const pres = this.profanityFilterService.processString(message, {
          extraRegex: custom_words_regex,
          useDefaultRegex: this.profanitySettings.profanity_default_words,
          replace: true,
        });
        message = pres[0];
        hasProfanity = pres[1];
      // Clear message if any profanity present
      } else if (this.profanitySettings.profanity_mode === 3 || this.profanitySettings.profanity_mode === 4) {
        const pres = this.profanityFilterService.processString(message, {
          extraRegex: custom_words_regex,
          useDefaultRegex: this.profanitySettings.profanity_default_words,
          replace: false,
        });

        if (pres[1]) {
          message = '';
          hasProfanity = true;
        }
      }
    } catch (ex) {
      return { profanity: hasProfanity, message, from: 'Anonymous', name: 'Anonymous' };
    }

    return { profanity: hasProfanity, message, from: name, name };
  }

  configureProfanityFilter() {
    this.fetchProfanityFilterSettings().then(response => {
      this.profanitySettings = {
        profanity_custom_words: response.settings.profanity_custom_words,
        profanity_default_words: response.settings.profanity_default_words,
        profanity_mode: parseInt(response.settings.profanity_mode, 10),
        profanity_names: response.settings.profanity_names,
      };
    });
  }

  activate() {
    this.active = true;
    this.initSocketConnection();
  }

  startup() {
    this.fetchFacemaskSettings().then(response => {
      this.checkFacemaskSettings(response);
    }).catch(err => {
      this.active = false;
    });
  }

  notifyFailure() {
    this.active = false;
    const ok = electron.remote.dialog.showMessageBox(
      electron.remote.getCurrentWindow(),
      {
        type: 'warning',
        message: 'We encountered an issue setting up your Face Mask Library',
        detail: 'Click Retry to try again',
        buttons: ['Retry', 'OK']
      },
      btnIndex => {
        if (btnIndex === 0) {
          this.startup();
        }
      }
    );
  }

  static defaultState:IFacemasksServiceState = {
    devices: {},
    modtimeMap: {}
  };

  @mutation()
  private ADD_MODTIME(uuid: string, modtime: number) {
    Vue.set(this.state.modtimeMap, uuid, modtime);
  }

  getInputDevicesList() {
    const dummy = obs.InputFactory.create('dshow_input', 'fake tmp dshow device', {});
    const properties = dummy.properties.get('video_device_id') as obs.IListProperty;
    const devices = properties.details.items as IInputDeviceSelection[];
    dummy.release();
    devices.forEach(device => {
      device.selected = false;
    });

    if (devices.length === 1) {
      devices[0].selected = true;
    }

    const enabled = Object.keys(this.state.devices);

    if (enabled.length) {
      devices.forEach(device => {
        if (enabled.includes(device.value as string)) {
          device.selected = true;
        }
      });
    }

    return devices;
  }

  getStatus() {
    const availableDevices = this.getInputDevicesList();
    const enabledDeviceIds = Object.keys(this.state.devices);
    const availableDeviceSelected = availableDevices.some(device => {
      return enabledDeviceIds.includes(device.value as string);
    });
    console.log('eyo', this.enabled && availableDeviceSelected);
    return this.enabled && availableDeviceSelected;
  }

  updateSettings(settings: IFacemaskSettings) {
    const promises = Object.keys(settings.facemasks).map(uuid => {
      return this.downloadAndSaveModtime(uuid, false);
    });

    if (settings.transitions_enabled) {
      promises.push(this.downloadAndSaveModtime(settings.transition.uuid, false));
    }

    Promise.all(promises).then(() => {
      this.active = settings.enabled;
    }).catch(err => {
      this.notifyFailure();
    });

    settings.devices.forEach(device => {
      this.ADD_DEVICE(device.name, device.value);
    });
  }

  getEnabledDevices() {
    return this.state.devices;
  }

  @mutation()
  private ADD_DEVICE(name: string, id: string) {
    Vue.set(this.state.devices, id, name);
  }

  fetchFacemaskSettings() {
    const host = this.hostsService.streamlabs;
    const url = `${host}/api/v5/slobs/facemasks/settings`;
    const headers = authorizedHeaders(this.apiToken);
    const request = new Request(url, { headers });

    return fetch(request)
      .then(handleErrors)
      .then(response => response.json());
  }

  fetchInstallUpdate(uuid:string) {
    const host = this.hostsService.streamlabs;
    const url = `${host}/api/v5/slobs/facemasks/install/${uuid}`;
    const request = new Request(url, {});

    return fetch(request)
      .then(handleErrors)
      .then(response => response.json());
  }

  fetchProfanityFilterSettings() {
    const host = this.hostsService.streamlabs;
    const url = `${host}/api/v5/slobs/widget/settings?widget=donation_page`;
    const headers = authorizedHeaders(this.apiToken);
    const request = new Request(url, { headers });

    return fetch(request)
      .then(handleErrors)
      .then(response => response.json());
  }

  checkFacemaskSettings(settings:IFacemaskSettings) {
    if (settings.enabled) {
      this.configureProfanityFilter();
      const uuids = settings.data.map((mask: IFacemask) => {
        return mask.uuid;
      });

      this.enabled = settings.enabled;
      this.initialized = settings.initialized;

      const missingMasks = uuids.filter(uuid => this.checkDownloaded(uuid));
      const downloads = missingMasks.map(uuid => this.downloadAndSaveModtime(uuid, false));

      Promise.all(downloads).then((responses) => {
        this.ensureModtimes(settings.data);
      }).catch(err => {
        this.notifyFailure();
      });

    } else {
      this.active = false;
    }
  }

  ensureModtimes(data:IFacemask[]) {
    const requiredModtimes = data.map(mask => mask.uuid);
    const availableModtimes = Object.keys(this.state.modtimeMap);
    const missingModtimes = requiredModtimes.filter(uuid => !availableModtimes.includes(uuid));
    this.getMissingModtimes(missingModtimes).then(() => {
      this.updateMasks(data);
    });
  }

  getMissingModtimes(missing:string[]) {
    return new Promise((resolve, reject) => {
      const asyncReads = missing.map(uuid => this.readFile(uuid));
      Promise.all(asyncReads).then(results => {
        resolve();
      }).catch(err => {
        this.notifyFailure();
        reject();
      });
    });
  }

  updateMasks(data: IFacemask[]) {
    const needsUpdate = data.reduce((result, mask) => {
      if (this.state.modtimeMap[mask.uuid] < (mask.modtime - 3600)) {
        result.push(mask.uuid);
      }
      return result;
    }, []);

    const downloads = needsUpdate.map(uuid => this.downloadAndSaveModtime(uuid, true));

    Promise.all(downloads).then(responses => {
      this.activate();
    }).catch(err => {
      this.notifyFailure();
    });
  }

  readFile(uuid: string) {
    const maskPath = this.libraryPath(uuid);
    return new Promise((resolve, reject) => {
      fs.readFile(maskPath, 'utf8', (readError, data) => {
        if (readError) reject(readError);
        try {
          const maskData = JSON.parse(data);
          this.ADD_MODTIME(uuid, maskData.modtime);
          resolve();
        } catch (parseError) {
          fs.unlinkSync(maskPath);
          reject(parseError);
        }
      });
    });
  }

  checkDownloaded(uuid: string) {
    const maskPath = this.libraryPath(uuid);
    return !fs.existsSync(maskPath);
  }

  enableMask(uuid:string) {
    this.downloadMask(uuid).then(modtime => {
      this.ADD_MODTIME(uuid, modtime);
      this.fetchInstallUpdate(uuid);
    });
  }

  // Try to download a mask, resolve whether operation was successful or not
  downloadAndSaveModtime(uuid: string, update = false): Promise<any> {
    return new Promise((resolve, reject) => {
      this.downloadMask(uuid, update).then(modtime => {
        if (modtime) {
          this.ADD_MODTIME(uuid, modtime);
          this.fetchInstallUpdate(uuid);
          resolve();
        }
      }).catch(err => {
        reject(err);
      });
    });
  }

  // Returns a promise that resolves with a masks modtime or false if it is already downloaded
  downloadMask(uuid: string, update = false): Promise<number> {
    const maskPath = this.libraryPath(uuid);

    // Don't re-download the facemassk if we have already downloaded it unless it needs to be updated
    if (!update && fs.existsSync(maskPath)) {
      return Promise.resolve(null);
    }

    let fileContent = '';
    return new Promise((resolve, reject) => {
      this.ensureFacemasksDirectory();

      https.get(this.libraryUrl(uuid), response => {
        const writeStream = fs.createWriteStream(maskPath);
        response.on('data', chunk => fileContent += chunk);
        writeStream.on('finish', () => {
          try {
            const data = JSON.parse(fileContent) as IFacemask;
            resolve(data.modtime);
          } catch (err) {
            reject(err);
          }
        });
        response.pipe(writeStream);
      });
    });
  }

  private ensureFacemasksDirectory() {
    if (!fs.existsSync(this.facemasksDirectory)) {
      fs.mkdirSync(this.facemasksDirectory);
    }
  }

  private libraryPath(uuid: string) {
    return path.join(this.facemasksDirectory, `${uuid}.json`);
  }

  private get facemasksDirectory() {
    return path.join(electron.remote.app.getPath('userData'), 'Facemasks');
  }

  private libraryUrl(uuid: string) {
    return `${this.cdn}${uuid}.json`;
  }
}
