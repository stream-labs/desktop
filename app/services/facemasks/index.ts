import Vue from 'vue';
import { PersistentStatefulService } from 'services/core/persistent-stateful-service';
import { UserService } from 'services/user';
import { HostsService } from 'services/hosts';
import { SourcesService } from 'services/sources';
import { ISource } from 'services/sources/sources-api';
import { Source } from 'services/sources/source';
import { SourceFiltersService } from 'services/source-filters';
import { mutation } from 'services/core/stateful-service';
import { Inject } from 'services/core/injector';
import { WebsocketService, TSocketEvent, IAlertPlayingSocketEvent } from 'services/websocket';
import { StreamingService } from 'services/streaming';
import { WindowsService } from 'services/windows';
import { handleResponse, authorizedHeaders } from 'util/requests';
import * as obs from '../../../obs-api';
import path from 'path';
import fs from 'fs';
import https from 'https';
import electron from 'electron';
import { TObsValue } from 'components/obs/inputs/ObsInput';
import { $t } from 'services/i18n';
import { throttle } from 'lodash-decorators';
import * as Interfaces from './definitions';
import { AppService } from 'services/app';
import { propsToSettings } from 'util/obs';

export class FacemasksService extends PersistentStatefulService<Interfaces.IFacemasksServiceState> {
  @Inject() userService: UserService;
  @Inject() hostsService: HostsService;
  @Inject() websocketService: WebsocketService;
  @Inject() sourcesService: SourcesService;
  @Inject() sourceFiltersService: SourceFiltersService;
  @Inject() streamingService: StreamingService;
  @Inject() private windowsService: WindowsService;
  @Inject() appService: AppService;

  cdn = `https://${this.hostsService.facemaskCDN}`;
  facemaskFilter: obs.IFilter = null;
  socketConnectionActive = false;

  registeredDonations = {};
  registeredSubscriptions = {};
  registeredBits = {};
  downloadProgress = {};
  isDownloading = false;

  static defaultState: Interfaces.IFacemasksServiceState = {
    modtimeMap: {},
    active: false,
    downloadProgress: 0,
    settings: {
      enabled: false,
      donations_enabled: false,
      subs_enabled: false,
      sub_duration: 8,
      extension_enabled: false,
      bits_enabled: false,
      bits_duration: 10,
      bits_price: 500,
      pricing_options: [200, 500, 1000, 2000, 10000],
      primary_platform: 'twitch_account',
      partnered: false,
      t2masks: [],
      t3masks: [],
      facemasks: [],
      extension: false,
      extension_url: '',
      duration: 10,
      username: null,
      device: {
        name: null,
        value: null,
      },
    },
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

  registerDonationEvent(donation: Interfaces.IFacemaskDonation) {
    this.registeredDonations[donation.eventId] = donation.facemask;
  }

  registerBitsEvent(bits: Interfaces.IFacemaskBits) {
    this.registeredBits[bits.eventId] = bits.facemask;
  }

  registerSubscriptionEvent(subscription: Interfaces.IFacemaskSubscription) {
    const eventKey = subscription.name + subscription.subPlan;
    if (subscription.subPlan !== '2000' && subscription.subPlan !== '3000') {
      return;
    }

    // Pick Eligible Mask at random
    if (!subscription.subscriberId) {
      this.registeredSubscriptions[eventKey] = this.selectRandomMaskForSub(subscription);
    }

    this.registeredSubscriptions[eventKey] = this.fetchViewerMaskSelection(subscription);
  }

  fetchViewerMaskSelection(sub: Interfaces.IFacemaskSubscription) {
    const endpoint = 'slobs/facemasks/subscription';
    const data = {
      twitch_id: this.state.settings.twitch_id,
      subscriber_twitch_id: sub.subscriberId,
      tier: sub.subPlan,
    };
    const postData = {
      method: 'POST',
      body: JSON.stringify(data),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    };

    return this.formRequest(endpoint, postData);
  }

  selectRandomMaskForSub(sub: Interfaces.IFacemaskSubscription): Promise<{ uuid: string }> {
    return new Promise(resolve => {
      let availableMasks: string[] = [];

      if (sub.subPlan === '2000') {
        availableMasks = this.state.settings.t2masks.map(mask => {
          return mask.uuid;
        });
      }

      if (sub.subPlan === '3000') {
        availableMasks = this.state.settings.t2masks
          .concat(this.state.settings.t3masks)
          .map(mask => {
            return mask.uuid;
          });
      }

      resolve({ uuid: availableMasks[Math.floor(Math.random() * availableMasks.length)] });
    });
  }

  playDonationEvent(donation: Interfaces.IFacemaskDonation) {
    if (this.registeredDonations[donation.eventId] && this.facemaskFilter) {
      const uuid = this.registeredDonations[donation.eventId];
      delete this.registeredDonations[donation.eventId];
      this.trigger(uuid, this.state.settings.duration);
    }
  }

  playBitsEvent(bits: Interfaces.IFacemaskBits) {
    if (this.registeredBits[bits.eventId] && this.facemaskFilter) {
      const uuid = this.registeredBits[bits.eventId];
      delete this.registeredBits[bits.eventId];
      this.trigger(uuid, this.state.settings.bits_duration);
    }
  }

  playSubscriptionEvent(subscription: Interfaces.IFacemaskSubscription) {
    const eventKey = subscription.name + subscription.subPlan;
    if (this.registeredSubscriptions[eventKey] && this.facemaskFilter) {
      const uuidPromise = this.registeredSubscriptions[eventKey];
      delete this.registeredSubscriptions[eventKey];
      uuidPromise.then((response: Interfaces.IFacemaskSelection) => {
        if (response.uuid) {
          this.trigger(response.uuid, this.state.settings.sub_duration);
        } else {
          this.selectRandomMaskForSub(subscription).then(result => {
            this.trigger(result.uuid, this.state.settings.sub_duration);
          });
        }
      });
    }
  }

  shouldQueueDonationEvents() {
    return this.state.settings.donations_enabled;
  }

  shouldQueueSubscriptionEvents() {
    return this.state.settings.subs_enabled && this.state.settings.extension_enabled;
  }

  shouldQueueBitsEvents() {
    return this.state.settings.bits_enabled && this.state.settings.extension_enabled;
  }

  onSocketEvent(event: TSocketEvent) {
    if (event.type === 'fm-ext-enabled') {
      this.startup();
    }

    if (event.type === 'facemaskdonation' && this.shouldQueueDonationEvents()) {
      this.registerDonationEvent({
        facemask: event.message[0].facemask,
        eventId: event.message[0]._id,
      });
    }

    if (
      event.type === 'subscription' &&
      this.shouldQueueSubscriptionEvents() &&
      event.message[0].subscriber_twitch_id
    ) {
      this.registerSubscriptionEvent({
        subscriberId: event.message[0].subscriber_twitch_id,
        subPlan: event.message[0].sub_plan,
        name: event.message[0].name.toLowerCase(),
      });
    }

    if (event.type === 'bits' && this.shouldQueueBitsEvents() && event.message[0].data) {
      this.registerBitsEvent({
        facemask: event.message[0].data.facemask,
        eventId: event.message[0].data.fm_id,
      });
    }

    if (event.type === 'alertPlaying') {
      this.onAlertPlayingSocketEvent(event);
    }
  }

  onAlertPlayingSocketEvent(event: IAlertPlayingSocketEvent) {
    if (
      event.message.type === 'donation' &&
      event.message.facemask &&
      this.shouldQueueDonationEvents()
    ) {
      this.playDonationEvent({ facemask: event.message.facemask, eventId: event.message._id });
    }

    if (event.message.type === 'subscription' && this.shouldQueueSubscriptionEvents()) {
      this.playSubscriptionEvent({
        subscriberId: event.message.subscriber_twitch_id,
        subPlan: event.message.sub_plan,
        name: event.message.name.toLowerCase(),
      });
    }

    if (event.message.type === 'bits' && this.shouldQueueBitsEvents() && event.message.data) {
      this.playBitsEvent({
        facemask: event.message.data.facemask,
        eventId: event.message.data.fm_id,
      });
    }
  }

  onSourceAdded(event: ISource) {
    if (this.state.active && event.type === 'dshow_input') {
      this.setupFilter();
    }
  }

  trigger(uuid: string, duration: number) {
    this.updateFilter({
      Mask: `${uuid}.json`,
      alertActivate: true,
      alertDuration: duration,
    });
    setTimeout(() => {
      this.updateFilter({ alertActivate: false });
    }, 500);
  }

  updateFilter(settings: Dictionary<TObsValue>) {
    if (this.facemaskFilter) {
      try {
        this.facemaskFilter.update(settings);
      } catch (e) {
        this.facemaskFilter = null;
        this.setupFilter();
      }
    }
  }

  getInputDevicesList() {
    const dummy = obs.InputFactory.create('dshow_input', 'fake tmp dshow device', {});
    const properties = dummy.properties.get('video_device_id') as obs.IListProperty;
    const devices = properties.details.items as Interfaces.IInputDeviceSelection[];
    dummy.release();
    devices.forEach(device => {
      device.selected = false;
    });

    if (devices.length === 1) {
      devices[0].selected = true;
    }

    const enabled = this.state.settings.device.value;

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
    const enabledDeviceId = this.state.settings.device ? this.state.settings.device.value : null;
    const availableDeviceSelected = enabledDeviceId
      ? availableDevices.some(device => {
          return enabledDeviceId === (device.value as string);
        })
      : false;

    return this.state.settings.enabled && availableDeviceSelected;
  }

  checkFacemaskSettings(settings: Interfaces.IFacemaskSettings) {
    this.SET_SETTINGS(settings);

    if (!settings.enabled) {
      this.SET_ACTIVE(false);
      return;
    }

    if (!this.checkForPlugin()) {
      this.SET_ACTIVE(false);
      this.notifyPluginMissing();
      return;
    }

    if (settings.device.name && settings.device.value) {
      this.setupFilter();
    } else {
      this.SET_ACTIVE(false);
    }

    if (this.isDownloading) {
      return;
    }

    let uuids = settings.facemasks.map((mask: Interfaces.IFacemask) => {
      return { uuid: mask.uuid, intro: mask.is_intro };
    });

    const t3 = settings.t3masks.map((mask: Interfaces.IFacemask) => {
      return { uuid: mask.uuid, intro: mask.is_intro };
    });

    const t2 = settings.t2masks.map((mask: Interfaces.IFacemask) => {
      return { uuid: mask.uuid, intro: mask.is_intro };
    });

    uuids = uuids.concat(t3).concat(t2);

    this.isDownloading = true;

    const missingMasks = uuids.filter(mask => this.checkDownloaded(mask.uuid));
    const downloads = missingMasks.map(mask =>
      this.downloadAndSaveModtime(mask.uuid, mask.intro, false),
    );

    this.setDownloadProgress(missingMasks.map(mask => mask.uuid));

    Promise.all(downloads)
      .then(responses => {
        this.ensureModtimes(settings.facemasks);
        this.isDownloading = false;
      })
      .catch(err => {
        console.log(err);
        this.notifyFailure();
        this.isDownloading = false;
      });
  }

  setDownloadProgress(downloads: string[]) {
    this.state.settings.facemasks.forEach(mask => {
      this.downloadProgress[mask.uuid] = 1;
    });
    downloads.forEach(uuid => {
      this.downloadProgress[uuid] = 0;
    });
  }

  @throttle(500)
  updateDownloadProgress() {
    let progress = 0;

    if (!this.state.settings.enabled) {
      return;
    }

    Object.keys(this.downloadProgress).forEach(key => {
      progress += this.downloadProgress[key];
    });

    if (progress / Object.keys(this.downloadProgress).length === 1 && this.state.active) {
      progress = 1;
    } else {
      progress = progress / Object.keys(this.downloadProgress).length;
    }

    this.SET_DOWNLOAD_PROGRESS(progress);
  }

  // Redundant function to be deleted once legacy settings page is sunsetted
  getDownloadProgress() {
    if (!this.state.settings.enabled) {
      return 'Not Enabled';
    }

    let current = 0;
    Object.keys(this.downloadProgress).forEach(key => {
      current += this.downloadProgress[key];
    });

    if (current / Object.keys(this.downloadProgress).length === 1) {
      return this.state.active ? 'Ready' : 'Loading';
    }
    return `${((current / Object.keys(this.downloadProgress).length) * 100).toFixed(2)}%`;
  }

  getEnabledDevice() {
    return this.state.settings.device;
  }

  getEnabledStatus() {
    return this.state.settings.enabled;
  }

  fetchFacemaskSettings() {
    return this.formRequest('slobs/facemasks/settings');
  }

  async updateFacemaskSettings(settings: Interfaces.IUserFacemaskSettings) {
    const endpoint = 'slobs/facemasks/settings';
    const postData = {
      method: 'POST',
      body: JSON.stringify(settings),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    };
    try {
      await this.formRequest(endpoint, postData);
      this.startup();
    } catch (e) {
      throw e;
    }
  }

  setupFilter() {
    const sources = this.sourcesService.getSources();

    const dshowInputs = sources.filter(source => {
      return source.type === 'dshow_input';
    });

    this.updateFilterReference(dshowInputs);
  }

  getMatchingWebcams(dshowInputs: Source[]) {
    return dshowInputs.filter(videoInput => {
      const settings = propsToSettings(videoInput.getObsInput().properties);
      return settings.video_device_id === this.state.settings.device.value;
    });
  }

  updateFilterReference(dshowInputs: Source[]) {
    if (dshowInputs.length) {
      const matches = this.getMatchingWebcams(dshowInputs);

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
              alertDuration: this.state.settings.duration,
              alertDoIntro: false,
              alertDoOutro: false,
              alertActivate: false,
            },
          );
        } else {
          this.facemaskFilter = fmFilter;
          this.updateFilter({
            maskFolder: this.facemasksDirectory,
            alertDuration: this.state.settings.duration,
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

  ensureModtimes(data: Interfaces.IFacemask[]) {
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
        .then(results => resolve())
        .catch(err => {
          this.notifyFailure();
          reject();
        });
    });
  }

  updateMasks(data: Interfaces.IFacemask[]) {
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
      .then(() => {
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
    });
  }

  // Try to download a mask, resolve whether operation was successful or not
  downloadAndSaveModtime(uuid: string, intro: boolean, update = false): Promise<any> {
    return new Promise((resolve, reject) => {
      this.downloadMask(uuid, update)
        .then(modtime => {
          if (modtime) {
            this.ADD_MODTIME(uuid, modtime, intro);
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

    // Don't re-download the facemask if we have already downloaded it unless it needs to be updated
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
          this.downloadProgress[uuid] = current / length;
          this.updateDownloadProgress();
          fileContent += chunk;
        });

        writeStream.on('finish', () => {
          try {
            const data = JSON.parse(fileContent) as Interfaces.IFacemask;
            this.downloadProgress[uuid] = 1;
            this.updateDownloadProgress();
            resolve(data.modtime);
          } catch (err) {
            reject(err);
          }
        });
        response.pipe(writeStream);
      });
    });
  }

  showSettings(categoryName?: string) {
    this.windowsService.showWindow({
      componentName: 'FacemaskSettings',
      title: $t('Face Mask Settings'),
      queryParams: { categoryName },
      size: {
        width: 800,
        height: 800,
      },
    });
  }

  closeSettings() {
    this.windowsService.closeChildWindow();
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
  private SET_SETTINGS(settings: Interfaces.IFacemaskSettings) {
    this.state.settings = settings;
  }

  @mutation()
  private SET_DOWNLOAD_PROGRESS(progress: number) {
    this.state.downloadProgress = progress;
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
    return path.join(this.appService.appDataDirectory, 'plugin_config/facemask-plugin');
  }

  private libraryUrl(uuid: string) {
    return `${this.cdn}${uuid}.json`;
  }

  private formRequest(endpoint: string, options: any = {}) {
    const host = this.hostsService.streamlabs;
    const headers = authorizedHeaders(this.apiToken, options.headers);
    const url = `https://${host}/api/v5/${endpoint}`;
    const request = new Request(url, { ...options, headers });

    return fetch(request).then(handleResponse);
  }
}
