import electron from 'electron';
import { Service } from './services/service';
import { AutoConfigService } from './services/auto-config';
import { ConfigPersistenceService } from './services/config-persistence';
import { ObsImporterService } from './services/obs-importer';
import { YoutubeService } from './services/platforms/youtube';
import { TwitchService } from './services/platforms/twitch';
import { ScenesService, SceneItem, Scene } from './services/scenes';
import { ClipboardService } from  './services/clipboard';
import { AudioService, AudioSource } from  './services/audio';
import { CustomizationService } from  './services/customization';
import { HostsService } from  './services/hosts';
import { Hotkey, HotkeysService } from  './services/hotkeys';
import { KeyListenerService } from  './services/key-listener';
import { NavigationService } from  './services/navigation';
import { ObsApiService } from  './services/obs-api';
import { OnboardingService } from  './services/onboarding';
import { PerformanceService } from  './services/performance';
import { PersistentStatefulService } from  './services/persistent-stateful-service';
import { SettingsService } from  './services/settings';
import { SourcesService, Source } from  './services/sources';
import { UserService } from  './services/user';
import { VideoService } from  './services/video';
import { WidgetsService } from  './services/widgets';
import { WindowsService } from  './services/windows';
import { StatefulService } from './services/stateful-service';
import { ScenesTransitionsService } from  './services/scenes-transitions';
import { FontLibraryService } from './services/font-library';
import { SourceFiltersService } from  './services/source-filters';
import { AppService } from './services/app';
import { ShortcutsService } from './services/shortcuts';
import { CacheUploaderService } from './services/cache-uploader';
import { UsageStatisticsService } from './services/usage-statistics';
import StreamingService from  './services/streaming';
import Utils from './services/utils';
import { commitMutation } from './store';
import traverse from 'traverse';
import { ObserveList } from './util/service-observer';

const { ipcRenderer } = electron;

interface IRequestToService {
  id: string;
  payload: { action: 'initService' | 'callServiceMethod' } & Dictionary<any>;
}


interface IServiceResponce {
  id: string;
  mutations: IMutation[];
  payload: {
    isHelper?: boolean;
    helperName?: string;
    constructorArgs?: any[];

    isPromise?: boolean;
    promiseId?: string;
  };

  isError?: boolean;
}

enum E_PUSH_MESSAGE_TYPE { PROMISE }

interface IPushMessage {
  type: E_PUSH_MESSAGE_TYPE;
  payload: any;
}

interface IPromisePayload {
  promiseId: string;
  isRejected: boolean;
  data: any;
}


export interface IMutation {
  type: string;
  payload: any;
}


export class ServicesManager extends Service {

  /**
   * list of used application services
   */
  private services: Dictionary<any> = {
    AutoConfigService,
    YoutubeService,
    TwitchService,
    ScenesService, SceneItem, Scene,
    ClipboardService,
    AudioService, AudioSource,
    CustomizationService,
    HostsService,
    HotkeysService, Hotkey,
    KeyListenerService,
    NavigationService,
    ObsApiService,
    OnboardingService,
    PerformanceService,
    PersistentStatefulService,
    ScenesTransitionsService,
    SettingsService,
    SourceFiltersService,
    SourcesService, Source,
    StreamingService,
    UserService,
    VideoService,
    WidgetsService,
    WindowsService,
    FontLibraryService,
    ObsImporterService,
    ConfigPersistenceService,
    AppService,
    ShortcutsService,
    CacheUploaderService,
    UsageStatisticsService
  };

  private instances: Dictionary<Service> = {};
  private mutationsBufferingEnabled = false;
  private bufferedMutations: IMutation[] = [];

  /**
   * if result of calling a service method in the main window is promise -
   * we create a linked promise in the child window and keep it callbacks here until
   * the promise in the main window will be resolved or rejected
   */
  private promises: Dictionary<Function[]> = {};

  init() {

    if (Utils.isChildWindow()) {
      Service.setupProxy(service => this.applyIpcProxy(service));
      Service.setupInitFunction(service => {
        const serviceName = service.constructor.name;
        if (!this.services[serviceName]) return false;

        electron.ipcRenderer.sendSync('services-request', {
          action: 'initService',
          serviceName: service.constructor.name
        });

        return true;
      });
      return;
    }

    Service.serviceAfterInit.subscribe(service => this.initObservers(service));
  }


  private initObservers(observableService: Service): Service[] {
    const observeList: ObserveList = ObserveList.instance;
    const items = observeList.observations.filter(item => {
      return item.observableServiceName === observableService.serviceName;
    });
    return items.map(item => this.getService(item.observerServiceName).instance);
  }


  getService(serviceName: string) {
    return this.services[serviceName];
  }


  getStatefulServicesAndMutators(): Dictionary<typeof StatefulService> {
    const statefulServices = {};
    Object.keys(this.services).forEach(serviceName => {
      const ServiceClass = this.services[serviceName];
      const isStatefulService = ServiceClass['initialState'];
      const isMutator = ServiceClass.prototype.mutations;
      if (!isStatefulService && !isMutator) return;
      statefulServices[serviceName] = this.services[serviceName];
    });
    return statefulServices;
  }


  /**
   * start listen calls to services from child window
   */
  listenApiCalls() {
    ipcRenderer.on('services-request', (event: Electron.Event, request: IRequestToService) => {
      try {
        this.hadleServiceRequest(request);
      } catch (e) {
        ipcRenderer.send('services-response', { id: request.id, isError: true });
        throw e;
      }
    });
    ipcRenderer.send('services-ready');
  }

  /**
   * start listen messages from main window
   */
  listenMessages() {
    const promises = this.promises;

    ipcRenderer.on('services-message', (event: Electron.Event, message: IPushMessage) => {
      // handle promise reject/resolve
      const promisePayload = message.type === E_PUSH_MESSAGE_TYPE.PROMISE && message.payload as IPromisePayload;
      if (promisePayload) {
        const [resolve, reject] = promises[promisePayload.promiseId];
        const callback = promisePayload.isRejected ? reject : resolve;
        callback(promisePayload.data);
        delete promises[promisePayload.promiseId];
      }

    });
  }


  isMutationBufferingEnabled() {
    return this.mutationsBufferingEnabled;
  }


  addMutationToBuffer(mutation: IMutation) {
    this.bufferedMutations.push(mutation);
  }

  private hadleServiceRequest(request: IRequestToService) {
    const action = request.payload.action;
    let response: IServiceResponce;
    this.startBufferingMutations();

    if (action === 'initService') {

      this.initService(request.payload.serviceName);
      response = {
        id: request.id,
        mutations: this.stopBufferingMutations(),
        payload: null
      };

    } else if (action === 'callServiceMethod') {
      const {
        serviceName,
        methodName,
        args,
        isHelper,
        constructorArgs
      } = request.payload;

      let responsePayload: any;

      if (isHelper) {
        const helper = this.getHelper(serviceName, constructorArgs);
        responsePayload = helper[methodName].apply(helper, args);
      } else {
        const service = this.getInstance(serviceName);
        responsePayload = service[methodName].apply(service, args);
      }

      const isPromise = !!(responsePayload && responsePayload.then);

      if (isPromise) {
        const promiseId = ipcRenderer.sendSync('getUniqueId');
        const promise = responsePayload as PromiseLike<any>;

        promise.then(
          (data) => this.sendPromiseMessage({ isRejected: false, promiseId, data }),
          (data) => this.sendPromiseMessage({ isRejected: true, promiseId, data })
        );

        response = {
          id: request.id,
          mutations: this.stopBufferingMutations(),
          payload: {
            isPromise: true,
            promiseId
          }
        };
      } else if (responsePayload && responsePayload.isHelper) {
        response = {
          id: request.id,
          mutations: this.stopBufferingMutations(),
          payload: {
            isHelper: true,
            helperName: responsePayload.helperName,
            constructorArgs: responsePayload.constructorArgs
          }
        };
      } else {
        response = {
          id: request.id,
          mutations: this.stopBufferingMutations(),
          payload: responsePayload
        };
      }
    }

    ipcRenderer.send('services-response', response);
  }


  /**
   * start buffering mutations to send them
   * as result of a service's method call
   */
  private startBufferingMutations() {
    this.mutationsBufferingEnabled = true;
  }


  /**
   * stop buffering and clear buffer
   */
  private stopBufferingMutations(): IMutation[] {
    this.mutationsBufferingEnabled = false;
    const mutations = this.bufferedMutations;
    this.bufferedMutations = [];
    return mutations;
  }


  /**
   * uses for child window services
   * all services methods calls will be sent to the main window
   */
  private applyIpcProxy(service: Service): Service {

    const availableServices = Object.keys(this.services);
    if (!availableServices.includes(service.constructor.name)) return service;

    return new Proxy(service, {
      get: (target, property, receiver) => {

        if (!target[property]) return target[property];

        if (target[property].isHelper) {
          return this.applyIpcProxy(target[property]);
        }

        if (typeof target[property] !== 'function') return target[property];

        const serviceName = target.constructor.name;
        const methodName = property;
        const isHelper = target['isHelper'];
        const constructorArgs = isHelper ? target['constructorArgs'] : [];

        return (...args: any[]) => {

          const response: IServiceResponce = electron.ipcRenderer.sendSync('services-request', {
            action: 'callServiceMethod',
            serviceName,
            methodName,
            args,
            isHelper,
            constructorArgs
          });

          if (response.isError) {
            throw 'IPC request failed: check the errors in the main window';
          }

          const payload = response.payload;
          response.mutations.forEach(mutation => commitMutation(mutation));

          if (payload && payload.isPromise) {
            return new Promise((resolve, reject) => {
              this.promises[payload.promiseId] = [resolve, reject];
            });
          } else if (payload && payload.isHelper) {
            const helper = this.getHelper(payload.helperName, payload.constructorArgs);
            return this.applyIpcProxy(helper);
          } else {
            // payload can contain helpers-objects
            // we have to wrap them in IpcProxy too
            traverse(payload).forEach((item: any) => {
              if (item && item.isHelper) {
                const helper = this.getHelper(item.helperName, item.constructorArgs);
                return this.applyIpcProxy(helper);
              }
            });
            return payload;
          }



        };
      }
    });
  }


  private getHelper(name: string, constructorArgs: any[]) {
    const Helper = this.services[name];
    return new (Helper as any)(...constructorArgs);
  }


  private initService(serviceName: string) {
    const ServiceClass = this.services[serviceName];
    if (!ServiceClass) throw `unknown service: ${serviceName}`;
    if (this.instances[serviceName]) return;
    this.instances[serviceName] = ServiceClass.instance;
  }


  private getInstance(serviceName: string): Service {
    return this.instances[serviceName];
  }

  /**
   * send push-message to child window
   */
  private sendMessage(message: IPushMessage) {
    ipcRenderer.send('services-message', message);
  }


  private sendPromiseMessage(payload: IPromisePayload) {
    this.sendMessage({
      type: E_PUSH_MESSAGE_TYPE.PROMISE,
      payload
    });
  }
}
