import Vue from 'vue';
import { PersistentStatefulService } from './persistent-stateful-service';
import { UserService } from 'services/user';
import { HostsService } from './hosts';
import { SourcesService } from './sources';
import { ISource } from 'services/sources/sources-api';
import { Source } from 'services/sources/source';
import { SourceFiltersService } from './source-filters';
import { Inject } from 'util/injector';
import { handleResponse, authorizedHeaders } from 'util/requests';
import { mutation } from './stateful-service';
import * as obs from '../../obs-api';
import path from 'path';
import fs from 'fs';
import https from 'https';
import electron from 'electron';
import { WebsocketService, TSocketEvent } from 'services/websocket';
import { TObsValue } from 'components/obs/inputs/ObsInput';
import { StreamingService } from 'services/streaming';
import { $t } from 'services/i18n';

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

interface IFacemaskSettings {
  enabled: boolean;
  facemasks: IFacemask[];
  audio_volume: number;
  duration: number;
  device: IInputDeviceSelection;
}

interface IFacemaskAlertMessage {
  name: string;
  formattedAmount: string;
  facemask: string;
  message: string;
}

interface IFacemaskDonation {
  eventId: string;
  facemask: string;
}

interface IDownloadProgress {
  uuid: string;
  progress: number;
}

export class FacemasksService extends PersistentStatefulService<IFacemasksServiceState> {
  @Inject() userService: UserService;
  @Inject() hostsService: HostsService;
  @Inject() websocketService: WebsocketService;
  @Inject() sourcesService: SourcesService;
  @Inject() sourceFiltersService: SourceFiltersService;
  @Inject() streamingService: StreamingService;

  cdn = `https://${this.hostsService.facemaskCDN}`;
  facemaskFilter: obs.IFilter = null;
  socketConnectionActive = false;

  registeredDonations = {};

  settings: IFacemaskSettings = {
    enabled: false,
    facemasks: [],
    audio_volume: 50,
    duration: 10,
    device: {
      name: null,
      value: null,
    },
  };

  downloadProgress: IDownloadProgress[] = [];

  static defaultState: IFacemasksServiceState = {
    device: { name: null, value: null },
    modtimeMap: {},
    active: false,
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
    this.streamingService.streamingStatusChange.subscribe(status => {
      if (status === 'starting' && this.userService.isLoggedIn()) this.startup();
    });
  }

  startup() {
    this.fetchFacemaskSettings()
      .then(response => {
        this.checkFacemaskSettings(response);
      })
      .catch(err => {
        this.SET_ACTIVE(false);
      });
  }

  activate() {
    this.SET_ACTIVE(true);
    this.initSocketConnection();
  }

  checkForPlugin() {
    return obs.ModuleFactory.modules().includes('facemask-plugin.dll');
  }

  notifyFailure() {
    this.SET_ACTIVE(false);
    const ok = electron.remote.dialog.showMessageBox(
      electron.remote.getCurrentWindow(),
      {
        type: 'warning',
        message: $t('We encountered an issue setting up your Face Mask Library'),
        detail: $t('Click Retry to try again'),
        buttons: ['Retry', 'OK'],
      },
      btnIndex => {
        if (btnIndex === 0) {
          this.startup();
        }
      },
    );
  }

  notifyPluginMissing() {
    const ok = electron.remote.dialog.showMessageBox(electron.remote.getCurrentWindow(), {
      type: 'warning',
      message: $t('Unable to find face mask plugin. You will not be able to use Face Masks'),
      buttons: ['OK'],
    });
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

  registerDonationEvent(donation: IFacemaskDonation) {
    this.registeredDonations[donation.eventId] = donation.facemask;
  }

  playDonationEvent(donation: IFacemaskDonation) {
    if (this.registeredDonations[donation.eventId] && this.facemaskFilter) {
      delete this.registeredDonations[donation.eventId];
      this.trigger(donation.facemask);
    }
  }

  onSocketEvent(event: TSocketEvent) {
    if (event.type === 'facemaskdonation') {
      this.registerDonationEvent({
        facemask: event.message[0].facemask,
        eventId: event.message[0]._id,
      });
    }
    if (event.type === 'alertPlaying' && event.message.facemask) {
      this.playDonationEvent({ facemask: event.message.facemask, eventId: event.message._id });
    }
  }

  onSourceAdded(event: ISource) {
    if (this.active && event.type === 'dshow_input') {
      this.setupFilter();
    }
  }

  trigger(mask: string) {
    this.updateFilter({
      Mask: `${mask}.json`,
      alertActivate: true,
    });
    setTimeout(() => {
      this.facemaskFilter.update({ alertActivate: false });
    }, 500);
  }

  updateFilter(settings: Dictionary<TObsValue>) {
    if (this.facemaskFilter) this.facemaskFilter.update(settings);
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
        if (enabled === (device.value as string)) {
          device.selected = true;
        }
      });
    }

    return devices;
  }

  getDeviceStatus() {
    const availableDevices = this.getInputDevicesList();
    const enabledDeviceId = this.state.device ? this.state.device.value : null;
    const availableDeviceSelected = enabledDeviceId
      ? availableDevices.some(device => {
          return enabledDeviceId === (device.value as string);
        })
      : false;
    return this.settings.enabled && availableDeviceSelected;
  }

  checkFacemaskSettings(settings: IFacemaskSettings) {
    this.settings = settings;

    if (!settings.enabled) {
      this.SET_ACTIVE(false);
      return;
    }

    if (!this.checkForPlugin()) {
      this.SET_ACTIVE(false);
      this.notifyPluginMissing();
      return;
    }

    const uuids = settings.facemasks.map((mask: IFacemask) => {
      return { uuid: mask.uuid, intro: mask.is_intro };
    });

    if (settings.device.name && settings.device.value) {
      this.SET_DEVICE(settings.device.name, settings.device.value);
      this.setupFilter();
    } else {
      this.SET_ACTIVE(false);
    }

    const missingMasks = uuids.filter(mask => this.checkDownloaded(mask.uuid));
    const downloads = missingMasks.map(mask =>
      this.downloadAndSaveModtime(mask.uuid, mask.intro, false),
    );

    this.setDownloadProgress(missingMasks.map(mask => mask.uuid));

    Promise.all(downloads)
      .then(responses => {
        this.ensureModtimes(settings.facemasks);
      })
      .catch(err => {
        console.log(err);
        this.notifyFailure();
      });
  }

  setDownloadProgress(downloads: string[]) {
    this.settings.facemasks.forEach(mask => {
      this.downloadProgress.push({ uuid: mask.uuid, progress: 1 });
    });
    downloads.forEach(uuid => {
      this.downloadProgress[uuid] = 0;
    });
  }

  getDownloadProgress() {
    if (!this.settings.enabled) {
      return 'Not Enabled';
    }

    let current = 0;
    this.downloadProgress.forEach(mask => {
      current += mask.progress;
    });
    if (current / this.downloadProgress.length === 1) {
      return this.state.active ? 'Ready' : 'Loading';
    }
    return 'Downloading Masks';
  }

  getEnabledDevice() {
    return this.state.device;
  }

  fetchFacemaskSettings() {
    return this.formRequest('slobs/facemasks/settings');
  }

  fetchInstallUpdate(uuid: string) {
    return this.formRequest(`slobs/facemasks/install/${uuid}`);
  }

  fetchProfanityFilterSettings() {
    return this.formRequest('slobs/widget/settings?widget=donation_page');
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
        const fmFilter = target.findFilter('Face Mask Plugin');

        if (!fmFilter) {
          this.facemaskFilter = this.sourceFiltersService.add(
            slobsSource.sourceId,
            'face_mask_filter',
            'Face Mask Plugin',
            {
              maskFolder: this.facemasksDirectory,
              alertDuration: this.settings.duration,
              alertDoIntro: false,
              alertDoOutro: false,
              alertActivate: false,
            },
          );
        } else {
          this.facemaskFilter = fmFilter;
          this.updateFilter({
            maskFolder: this.facemasksDirectory,
            alertDuration: this.settings.duration,
            alertDoIntro: false,
            alertDoOutro: false,
            alertActivate: false,
          });
        }
      }
    } else {
      this.facemaskFilter = null;
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

  getMissingModtimes(missing: string[]) {
    return new Promise((resolve, reject) => {
      const asyncReads = missing.map(uuid => this.readFile(uuid));
      Promise.all(asyncReads)
        .then(results => {
          resolve();
        })
        .catch(err => {
          this.notifyFailure();
          reject();
        });
    });
  }

  updateMasks(data: IFacemask[]) {
    const needsUpdate = data.reduce((result, mask) => {
      if (this.state.modtimeMap[mask.uuid].modtime < mask.modtime - 3600) {
        result.push({ uuid: mask.uuid, intro: mask.is_intro });
      }
      return result;
    }, []);

    const downloads = needsUpdate.map(mask =>
      this.downloadAndSaveModtime(mask.uuid, mask.intro, true),
    );

    Promise.all(downloads)
      .then(responses => {
        this.activate();
      })
      .catch(err => {
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

  enableMask(uuid: string) {
    this.downloadMask(uuid).then(modtime => {
      this.ADD_MODTIME(uuid, modtime, false);
      this.fetchInstallUpdate(uuid);
    });
  }

  // Try to download a mask, resolve whether operation was successful or not
  downloadAndSaveModtime(uuid: string, intro: boolean, update = false): Promise<any> {
    return new Promise((resolve, reject) => {
      this.downloadMask(uuid, update)
        .then(modtime => {
          if (modtime) {
            this.ADD_MODTIME(uuid, modtime, intro);
            this.fetchInstallUpdate(uuid);
          }
          resolve();
        })
        .catch(err => {
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

        const length = parseInt(response.headers['content-length'], 10);
        let current = 0;

        response.on('data', chunk => {
          current += chunk.length;
          this.downloadProgress.filter(mask => mask.uuid === uuid)[0]['progress'] =
            current / length;
          fileContent += chunk;
        });

        writeStream.on('finish', () => {
          try {
            const data = JSON.parse(fileContent) as IFacemask;
            this.downloadProgress.filter(mask => mask.uuid === uuid)[0]['progress'] = 1;
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

  private formRequest(endpoint: string) {
    const url = `https://${this.hostsService.streamlabs}/api/v5/${endpoint}`;
    const headers = authorizedHeaders(this.apiToken);
    const request = new Request(url, { headers });

    return fetch(request).then(handleResponse);
  }
}
