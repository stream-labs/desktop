import electron from 'electron';
import { Observable, Subject } from 'rxjs';
import { IJsonRpcEvent, IJsonRpcResponse, JsonrpcService } from 'services/api/jsonrpc';
import * as traverse from 'traverse';
import { Service } from '../service';
import { ServicesManager } from '../../services-manager';
import { commitMutation } from '../../store';
const { ipcRenderer } = electron;

export class ChildWindowApiClient {
  private servicesManager: ServicesManager = ServicesManager.instance;

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
            if (!promises[promisePayload.resourceId]) return; // this a promise created from another API client
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

  /**
   * uses for child window services
   * all services methods calls will be sent to the main window
   */
  applyIpcProxy(service: Service): Service {
    const availableServices = Object.keys(this.servicesManager.services);
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

  getResource(resourceId: string) {
    return this.servicesManager.getResource(resourceId);
  }

  get jsonrpc() {
    return JsonrpcService;
  }
}
