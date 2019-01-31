import electron from 'electron';
import uuid from 'uuid/v4';
import 'reflect-metadata';
import { Service } from 'services/service';
import Utils from './services/utils';
import { commitMutation } from './store';
import traverse from 'traverse';
import { ObserveList } from './util/service-observer';
import { from, Observable, Subject, Subscription } from 'rxjs';
import { StatefulService } from './services/stateful-service';
import {
  E_JSON_RPC_ERROR,
  IJsonRpcEvent,
  IJsonRpcRequest,
  IJsonRpcResponse,
  IMutation,
  JsonrpcService,
} from 'services/jsonrpc';

const { ipcRenderer } = electron;

import * as appServices from './app-services';

export class ServicesManager extends Service {
  serviceEvent = new Subject<IJsonRpcResponse<IJsonRpcEvent>>();

  /**
   * list of used application services
   */
  private services: Dictionary<any> = {
    ...appServices,
  };

  private instances: Dictionary<Service> = {};
  private mutationsBufferingEnabled = false;
  private bufferedMutations: IMutation[] = [];

  /**
   * contains additional information about errors
   * while JSONRPC request handling
   */
  private requestErrors: string[] = [];

  /**
   * if result of calling a service method in the main window is promise -
   * we create a linked promise in the child window and keep it callbacks here until
   * the promise in the main window will be resolved or rejected
   */
  private windowPromises: Dictionary<Function[]> = {};
  /**
   * almost the same as windowPromises but for keeping subscriptions
   */
  private windowSubscriptions: Dictionary<Subject<any>> = {};

  /**
   * keep created subscriptions in main window to not allow to subscribe to the channel twice
   */
  subscriptions: Dictionary<Subscription> = {};

  init() {
    // this helps to debug services from the console
    if (Utils.isDevMode()) {
      window['sm'] = this;
    }

    if (!Utils.isMainWindow()) {
      Service.setupProxy(service => this.applyIpcProxy(service));
      Service.setupInitFunction(service => {
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
   * start listen messages from main window
   */
  listenMessages() {
    const promises = this.windowPromises;

    ipcRenderer.on(
      'services-message',
      (event: Electron.Event, message: IJsonRpcResponse<IJsonRpcEvent>) => {
        if (message.result._type !== 'EVENT') return;

        // handle promise reject/resolve
        if (message.result.emitter === 'PROMISE') {
          const promisePayload = message.result;
          if (promisePayload) {
            if (!promises[promisePayload.resourceId]) return; // this promise created from another API client
            const [resolve, reject] = promises[promisePayload.resourceId];
            const callback = promisePayload.isRejected ? reject : resolve;
            callback(promisePayload.data);
            delete promises[promisePayload.resourceId];
          }
        } else if (message.result.emitter === 'STREAM') {
          const resourceId = message.result.resourceId;
          if (!this.windowSubscriptions[resourceId]) return;
          this.windowSubscriptions[resourceId].next(message.result.data);
        }
      },
    );
  }

  isMutationBufferingEnabled() {
    return this.mutationsBufferingEnabled;
  }

  addMutationToBuffer(mutation: IMutation) {
    this.bufferedMutations.push(mutation);
  }

  executeServiceRequest(request: IJsonRpcRequest): IJsonRpcResponse<any> {
    let response: IJsonRpcResponse<any>;
    this.requestErrors = [];

    const handleErrors = (e?: any) => {
      if (!e && this.requestErrors.length === 0) return;
      if (e) {
        // re-raise error for Raven
        const isChildWindowRequest = request.params && request.params.fetchMutations;
        if (isChildWindowRequest) {
          setTimeout(() => {
            throw e;
          }, 0);
        }

        if (e.message) this.requestErrors.push(e.stack.toString());
      }

      response = this.jsonrpc.createError(request, {
        code: E_JSON_RPC_ERROR.INTERNAL_SERVER_ERROR,
        message: this.requestErrors.join(';'),
      });
    };

    try {
      response = this.handleServiceRequest(request);
      handleErrors();
    } catch (e) {
      handleErrors(e);
    } finally {
      // TODO: `return` inside `finally` is confusing
      return response;
    }
  }

  private get jsonrpc(): typeof JsonrpcService {
    return JsonrpcService;
  }

  private handleServiceRequest(request: IJsonRpcRequest): IJsonRpcResponse<any> {
    let response: IJsonRpcResponse<any>;
    const methodName = request.method;
    const { resource: resourceId, args, fetchMutations, compactMode } = request.params;

    if (fetchMutations) this.startBufferingMutations();

    const resource = this.getResource(resourceId);
    if (!resource) {
      response = this.jsonrpc.createError(request, {
        code: E_JSON_RPC_ERROR.INVALID_PARAMS,
        message: 'resource not found',
      });
    } else if (!resource[methodName]) {
      response = this.jsonrpc.createError(request, {
        code: E_JSON_RPC_ERROR.METHOD_NOT_FOUND,
        message: methodName,
      });
    }

    if (response) {
      if (this.isMutationBufferingEnabled()) this.stopBufferingMutations();
      return response;
    }

    let responsePayload: any;

    if (resource[methodName] instanceof Observable) {
      const subscriptionId = `${resourceId}.${methodName}`;
      responsePayload = {
        _type: 'SUBSCRIPTION',
        resourceId: subscriptionId,
        emitter: 'STREAM',
      };
      if (!this.subscriptions[subscriptionId]) {
        this.subscriptions[subscriptionId] = resource[methodName].subscribe((data: any) => {
          this.serviceEvent.next(
            this.jsonrpc.createEvent({
              data,
              emitter: 'STREAM',
              resourceId: subscriptionId,
            }),
          );
        });
      }
    } else if (typeof resource[methodName] === 'function') {
      responsePayload = resource[methodName].apply(resource, args);
    } else {
      responsePayload = resource[methodName];
    }

    const isPromise = !!(responsePayload && responsePayload.then);

    if (isPromise) {
      const promiseId = uuid();
      const promise = responsePayload as PromiseLike<any>;

      promise.then(
        data => this.sendPromiseMessage({ data, promiseId, isRejected: false }),
        data => this.sendPromiseMessage({ data, promiseId, isRejected: true }),
      );

      response = this.jsonrpc.createResponse(request, {
        _type: 'SUBSCRIPTION',
        resourceId: promiseId,
        emitter: 'PROMISE',
      });
    } else if (responsePayload && responsePayload.isHelper === true) {
      const helper = responsePayload;

      response = this.jsonrpc.createResponse(request, {
        _type: 'HELPER',
        resourceId: helper._resourceId,
        ...(!compactMode ? this.getHelperModel(helper) : {}),
      });
    } else if (responsePayload && responsePayload instanceof Service) {
      response = this.jsonrpc.createResponse(request, {
        _type: 'SERVICE',
        resourceId: responsePayload.serviceName,
        ...(!compactMode ? this.getHelperModel(responsePayload) : {}),
      });
    } else {
      // payload can contain helpers-objects
      // we have to wrap them in IpcProxy too
      traverse(responsePayload).forEach((item: any) => {
        if (item && item.isHelper === true) {
          const helper = this.getHelper(item.helperName, item.constructorArgs);
          return {
            _type: 'HELPER',
            resourceId: helper._resourceId,
            ...(!compactMode ? this.getHelperModel(helper) : {}),
          };
        }
      });

      response = this.jsonrpc.createResponse(request, responsePayload);
    }

    if (fetchMutations) response.mutations = this.stopBufferingMutations();

    return response;
  }

  /**
   * returns Service instance or ServiceHelper instance
   * @example
   * sourcesService = getResource('SourcesService')
   *
   * @example
   * source = getResource('Source[12]')
   */
  getResource(resourceId: string) {
    if (resourceId === 'ServicesManager') {
      return this;
    }

    if (this.services[resourceId]) {
      return this.getInstance(resourceId) || this.initService(resourceId);
    }

    const helperName = resourceId.split('[')[0];
    const constructorArgsStr = resourceId.substr(helperName.length);
    const constructorArgs = constructorArgsStr ? JSON.parse(constructorArgsStr) : void 0;
    return this.getHelper(helperName, constructorArgs);
  }

  /**
   * the information about resource scheme helps to improve performance for API clients
   * this is undocumented feature is mainly for our API client that we're using in tests
   */
  getResourceScheme(resourceId: string): Dictionary<string> {
    const resource = this.getResource(resourceId);
    if (!resource) {
      this.requestErrors.push(`Resource not found: ${resourceId}`);
      return null;
    }
    const resourceScheme = {};

    // collect resource keys from the whole prototype chain
    const keys: string[] = [];
    let proto = resource;
    do {
      keys.push(...Object.keys(proto));
      proto = Object.getPrototypeOf(proto);
    } while (proto.constructor.name !== 'Object');

    keys.forEach(key => {
      resourceScheme[key] = typeof resource[key];
    });

    return resourceScheme;
  }

  private getHelperModel(helper: Object): Object {
    if (helper['getModel'] && typeof helper['getModel'] === 'function') {
      return helper['getModel']();
    }
    return {};
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

        if (Reflect.getMetadata('executeInCurrentWindow', target, property as string)) {
          return target[property];
        }

        if (typeof target[property] !== 'function' && !(target[property] instanceof Observable)) {
          return target[property];
        }

        const serviceName = target.constructor.name;
        const methodName = property;
        const isHelper = target['isHelper'];

        const handler = (...args: any[]) => {
          const response: IJsonRpcResponse<any> = electron.ipcRenderer.sendSync(
            'services-request',
            this.jsonrpc.createRequestWithOptions(
              isHelper ? target['_resourceId'] : serviceName,
              methodName as string,
              { compactMode: true, fetchMutations: true },
              ...args,
            ),
          );

          if (response.error) {
            throw 'IPC request failed: check the errors in the main window';
          }

          const result = response.result;
          response.mutations.forEach(mutation => commitMutation(mutation));

          if (result && result._type === 'SUBSCRIPTION') {
            if (result.emitter === 'PROMISE') {
              return new Promise((resolve, reject) => {
                const promiseId = result.resourceId;
                this.windowPromises[promiseId] = [resolve, reject];
              });
            }

            if (result.emitter === 'STREAM') {
              return (this.windowSubscriptions[result.resourceId] =
                this.windowSubscriptions[result.resourceId] || new Subject());
            }
          }

          if (result && (result._type === 'HELPER' || result._type === 'SERVICE')) {
            const helper = this.getResource(result.resourceId);
            return this.applyIpcProxy(helper);
          }

          // payload can contain helpers-objects
          // we have to wrap them in IpcProxy too
          traverse(result).forEach((item: any) => {
            if (item && item._type === 'HELPER') {
              const helper = this.getResource(item.resourceId);
              return this.applyIpcProxy(helper);
            }
          });
          return result;
        };

        if (typeof target[property] === 'function') return handler;
        if (target[property] instanceof Observable) return handler();
      },
    });
  }

  private getHelper(name: string, constructorArgs: any[]) {
    const Helper = this.services[name];
    if (!Helper) return null;
    return new (Helper as any)(...constructorArgs);
  }

  private initService(serviceName: string): Service {
    const ServiceClass = this.services[serviceName];
    if (!ServiceClass) throw `unknown service: ${serviceName}`;
    if (this.instances[serviceName]) return;
    this.instances[serviceName] = ServiceClass.instance;
    return ServiceClass.instance;
  }

  private getInstance(serviceName: string): Service {
    return this.instances[serviceName];
  }

  private sendPromiseMessage(info: { isRejected: boolean; promiseId: string; data: any }) {
    this.serviceEvent.next(
      this.jsonrpc.createEvent({
        emitter: 'PROMISE',
        data: info.data,
        resourceId: info.promiseId,
        isRejected: info.isRejected,
      }),
    );
  }
}
