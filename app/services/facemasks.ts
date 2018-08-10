import Vue from 'vue';
import { PersistentStatefulService } from './persistent-stateful-service';
import { UserService } from 'services/user';
import { HostsService } from './hosts';
import { SourcesService } from './sources';
import { ISource } from 'services/sources/sources-api';
import { Source } from 'services/sources/source';
import { SourceFiltersService } from './source-filters';
import { Inject } from 'util/injector';
import { handleErrors, authorizedHeaders } from 'util/requests';
import { mutation } from './stateful-service';
import * as obs from './obs-api';
import path from 'path';
import fs from 'fs';
import https from 'https';
import electron from 'electron';
import { WebsocketService, TSocketEvent } from 'services/websocket';
import { ProfanityFilterService } from 'util/profanity';
import { TObsValue } from 'components/obs/inputs/ObsInput';
const notificationAudio = require('../../media/sound/facemask4.wav');

interface IFacemasksServiceState {
  device: IInputDeviceSelection;
  modtimeMap: Dictionary<IFacemaskMetadata>;
  active: boolean;
}

interface IFacemaskMetadata {
  modtime: number;
  intro: boolean;
}

interface IInputDeviceSelection {
  name: string;
  value: string;
  selected?: boolean;
}

interface IFacemask {
  modtime: number;
  uuid: string;
  is_intro: boolean;
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
  audio_volume: number;
  duration: number;
  data?: IFacemask[];
  device?: IInputDeviceSelection;
}

interface IFacemaskAlertMessage {
  name: string;
  amount: string;
  facemask: string;
  message: string;
}

export class FacemasksService extends PersistentStatefulService<IFacemasksServiceState> {
  @Inject() userService: UserService;
  @Inject() hostsService: HostsService;
  @Inject() websocketService: WebsocketService;
  @Inject() profanityFilterService: ProfanityFilterService;
  @Inject() sourcesService: SourcesService;
  @Inject() sourceFiltersService: SourceFiltersService;

  cdn = `https://${this.hostsService.facemaskCDN}`;
  queue: IFacemaskAlertMessage[] = [];
  playing = false;
  interval: number = null;
  facemaskFilter: obs.IFilter = null;
  socketConnectionActive = false;

  settings: IFacemaskSettings = {
    enabled: false,
    initialized: false,
    facemasks: {},
    transitions_enabled: false,
    audio_volume: 50,
    transition: {},
    duration: 10,
  };

  profanitySettings: IProfanitySettings = {
    profanity_custom_words: '',
    profanity_default_words: true,
    profanity_mode: 1,
    profanity_names: true,
  };

  static defaultState: IFacemasksServiceState = {
    device: { name: null, value: null },
    modtimeMap: {},
    active: false
  };

  init() {
    super.init();
    this.subscribeToSourceAdded();
    if (this.userService.isLoggedIn()) {
      this.startup();
    }
    this.userService.userLogin.subscribe(() => {
      this.startup();
    });
  }

  startup() {
    this.fetchFacemaskSettings().then(response => {
      this.checkFacemaskSettings(response);
    }).catch(err => {
      this.SET_ACTIVE(false);
    });
  }

  activate() {
    this.SET_ACTIVE(true);
    this.initSocketConnection();
  }

  notifyFailure() {
    this.SET_ACTIVE(false);
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

  get apiToken() {
    return this.userService.apiToken;
  }

  private initSocketConnection(): void {
    if (!this.socketConnectionActive) {
      this.websocketService.socketEvent.subscribe(e => this.onSocketEvent(e));
      this.socketConnectionActive = true;
    }
  }

  private subscribeToSourceAdded(): void {
    this.sourcesService.sourceAdded.subscribe(e => this.onSourceAdded(e));
  }

  onSocketEvent(event: TSocketEvent) {
    if (event.type === 'facemask') {
      this.enqueueAlert(event.message[0]);
    }
  }

  onSourceAdded(event: ISource) {
    if (event.type === 'dshow_input' && this.active) {
      this.updateFilterReference([this.sourcesService.getSourceById(event.sourceId)]);
    }
  }

  playAlerts() {
    if (!this.playing && this.queue.length) {
      this.playing = true;
      this.playQueuedAlert();
      this.interval = window.setInterval(() => this.playQueuedAlert(), (this.settings.duration * 1000) + 2000);
    }
  }

  playQueuedAlert() {
    if (this.queue.length) {
      const alert = this.queue.shift();
      this.trigger(alert.facemask, alert.message, alert.name);
    } else {
      this.playing = false;
      clearInterval(this.interval);
    }
  }

  playTestAudio(volume: number) {
    const alertSound = new Audio(notificationAudio);
    alertSound.volume = volume / 100;

    alertSound.play();
  }

  playAudio() {
    const alertSound = new Audio(notificationAudio);
    alertSound.volume = this.settings.audio_volume / 100;

    alertSound.play();
  }

  enqueueAlert(message: IFacemaskAlertMessage) {
    this.queue.push(message);
    this.playAlerts();
  }

  trigger(mask: string, message: string, name: string) {
    const clean = this.profanitize(message, name);
    this.updateFilter({
      Mask: `${mask}.json`,
      alertText: clean['message'],
      donorName: clean['name'],
      alertActivate: true
    });
    this.playAudio();
    setTimeout(() => {
      this.facemaskFilter.update({ alertActivate: false });
    }, 1000);
  }

  updateFilter(settings: Dictionary<TObsValue>) {
    if (this.facemaskFilter) this.facemaskFilter.update(settings);
  }

  playTestAlert() {
    if (this.active && this.socketConnectionActive) {
      const availableMasks = Object.keys(this.state.modtimeMap).filter(uuid  => {
        return Object.keys(this.settings.facemasks).includes(uuid) && !this.state.modtimeMap[uuid].intro;
      });

      if (availableMasks.length) {
        const testMask = availableMasks[Math.floor(Math.random() * availableMasks.length)];
        this.enqueueAlert({
          name: 'Streamlabs',
          amount: '10',
          facemask: testMask,
          message: 'This is a test Face Mask donation alert'
        });
      }
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

    const enabled = this.state.device.value;

    if (enabled) {
      devices.forEach(device => {
        if (enabled === device.value as string) {
          device.selected = true;
        }
      });
    }

    return devices;
  }

  getDeviceStatus() {
    const availableDevices = this.getInputDevicesList();
    const enabledDeviceId = this.state.device ? this.state.device.value : null;
    const availableDeviceSelected = enabledDeviceId ? availableDevices.some(device => {
      return enabledDeviceId  === device.value as string;
    }) : false;
    return this.settings.enabled && availableDeviceSelected;
  }

  updateSettings(settings: IFacemaskSettings) {
    this.settings = settings;
    if (settings.enabled) {
      const promises = Object.keys(settings.facemasks).map(uuid => {
        return this.downloadAndSaveModtime(uuid, false, false);
      });

      if (settings.transitions_enabled) {
        promises.push(this.downloadAndSaveModtime(settings.transition.uuid, true, false));
      }

      Promise.all(promises).then(() => {
        this.setupFilter();
        this.activate();
      }).catch(err => {
        this.notifyFailure();
      });

      this.SET_DEVICE(settings.device.name, settings.device.value);
    } else {
      this.SET_ACTIVE(false);
    }
  }

  checkFacemaskSettings(settings:IFacemaskSettings) {
    this.settings = settings;
    if (settings.enabled) {
      this.configureProfanityFilter();
      const uuids = settings.data.map((mask: IFacemask) => {
        return { uuid: mask.uuid, intro: mask.is_intro };
      });

      this.setupFilter();

      const missingMasks = uuids.filter(mask => this.checkDownloaded(mask.uuid));
      const downloads = missingMasks.map(mask => this.downloadAndSaveModtime(mask.uuid, mask.intro, false));

      Promise.all(downloads).then((responses) => {
        this.ensureModtimes(settings.data);
      }).catch(err => {
        console.log(err);
        this.notifyFailure();
      });

    } else {
      this.SET_ACTIVE(false);
    }
  }


  getEnabledDevice() {
    return this.state.device;
  }

  fetchFacemaskSettings() {
    const host = this.hostsService.streamlabs;
    const url = `https://${host}/api/v5/slobs/facemasks/settings`;
    const headers = authorizedHeaders(this.apiToken);
    const request = new Request(url, { headers });

    return fetch(request)
      .then(handleErrors)
      .then(response => response.json());
  }

  fetchInstallUpdate(uuid:string) {
    const host = this.hostsService.streamlabs;
    const url = `https://${host}/api/v5/slobs/facemasks/install/${uuid}`;
    const request = new Request(url, {});

    return fetch(request)
      .then(handleErrors)
      .then(response => response.json());
  }

  fetchProfanityFilterSettings() {
    const host = this.hostsService.streamlabs;
    const url = `https://${host}/api/v5/slobs/widget/settings?widget=donation_page`;
    const headers = authorizedHeaders(this.apiToken);
    const request = new Request(url, { headers });

    return fetch(request)
      .then(handleErrors)
      .then(response => response.json());
  }

  setupFilter() {
    const sources = this.sourcesService.getSources();

    const dshowInputs = sources.filter(source => {
      return source.type === 'dshow_input';
    });

    this.updateFilterReference(dshowInputs);
  }

  updateFilterReference(dshowInputs: Source[]) {
    if (dshowInputs.length) {
      const matches = dshowInputs.filter(videoInput => {
        return videoInput.getObsInput().settings.video_device_id === this.state.device.value;
      });

      if (matches.length === 1) {
        const slobsSource = matches[0];
        const target = slobsSource.getObsInput();
        const facemaskFilters = target.filters.filter(filter => filter.id === 'face_mask_filter');

        if (facemaskFilters.length === 0) {
          this.facemaskFilter = this.sourceFiltersService.add(
            slobsSource.sourceId,
            'face_mask_filter',
            'Face Mask Plugin',
            {
              maskFolder: this.facemasksDirectory,
              alertDuration: this.settings.duration,
              alertDoIntro: false,
              alertDoOutro: false,
              alertActivate: false
            });
        } else {
          this.facemaskFilter = facemaskFilters[0];
          this.updateFilter({
            maskFolder: this.facemasksDirectory,
            alertDuration: this.settings.duration,
            alertDoIntro: false,
            alertDoOutro: false,
            alertActivate: false
          });
        }
      }
    } else {
      this.SET_ACTIVE(false);
    }
  }

  ensureModtimes(data: IFacemask[]) {
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
      if (this.state.modtimeMap[mask.uuid].modtime < (mask.modtime - 3600)) {
        result.push({ uuid: mask.uuid, intro: mask.is_intro });
      }
      return result;
    }, []);

    const downloads = needsUpdate.map(mask => this.downloadAndSaveModtime(mask.uuid, mask.intro, true));

    Promise.all(downloads).then(responses => {
      this.activate();
    }).catch(err => {
      console.log(err);
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
          this.ADD_MODTIME(uuid, maskData.modtime, maskData.is_intro);
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
      this.ADD_MODTIME(uuid, modtime, false);
      this.fetchInstallUpdate(uuid);
    });
  }

  // Try to download a mask, resolve whether operation was successful or not
  downloadAndSaveModtime(uuid: string, intro: boolean, update = false): Promise<any> {
    return new Promise((resolve, reject) => {
      this.downloadMask(uuid, update).then(modtime => {
        if (modtime) {
          this.ADD_MODTIME(uuid, modtime, intro);
          this.fetchInstallUpdate(uuid);
        }
        resolve();
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

  get active() {
    return this.state.active;
  }

  @mutation()
  private ADD_MODTIME(uuid: string, modtime: number, intro: boolean) {
    Vue.set(this.state.modtimeMap, uuid, { modtime, intro });
  }

  @mutation()
  private SET_ACTIVE(active: boolean) {
    this.state.active = active;
  }

  @mutation()
  private SET_DEVICE(name: string, value: string) {
    this.state.device = { name, value };
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
    return path.join(electron.remote.app.getPath('userData'), 'plugin_config/facemask-plugin');
  }

  private libraryUrl(uuid: string) {
    return `${this.cdn}${uuid}.json`;
  }
}
