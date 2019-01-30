import uuid from 'uuid/v4';
import 'reflect-metadata';
import { Service } from 'services/service';
import traverse from 'traverse';
import { Observable, Subject, Subscription } from 'rxjs';
import {
  E_JSON_RPC_ERROR,
  IJsonRpcEvent,
  IJsonRpcRequest,
  IJsonRpcResponse,
  IMutation,
  JsonrpcService,
} from 'services/api/jsonrpc';
import { ServicesManager } from '../../services-manager';

export abstract class RpcApi extends Service {
  serviceEvent = new Subject<IJsonRpcResponse<IJsonRpcEvent>>();
  protected servicesManager: ServicesManager = ServicesManager.instance;
  private mutationsBufferingEnabled = false;
  private bufferedMutations: IMutation[] = [];

  /**
   * contains additional information about errors
   * while JSONRPC request handling
   */
  private requestErrors: string[] = [];

  /**
   * keep created subscriptions in main window to not allow to subscribe to the channel twice
   */
  subscriptions: Dictionary<Subscription> = {};

  isMutationBufferingEnabled() {
    return this.mutationsBufferingEnabled;
  }

  addMutationToBuffer(mutation: IMutation) {
    this.bufferedMutations.push(mutation);
  }

  /**
   * execute service requests and handle errors
   */
  executeServiceRequest(request: IJsonRpcRequest): IJsonRpcResponse<any> {
    console.log('execute request', request);
    let response: IJsonRpcResponse<any>;
    this.requestErrors = []; // cleanup errors from previous request
    try {
      response = this.handleServiceRequest(request);
    } catch (e) {
      this.requestErrors.push(e);
    }

    if (this.requestErrors.length) response = this.onErrorsHandler(request, this.requestErrors);
    console.log('response', response);
    return response;
  }

  /**
   * This is being called if the request raised exceptions
   * Must return errors in JSON-RPC format to send as an API response
   */
  protected onErrorsHandler(
    request: IJsonRpcRequest,
    errors: (string | Error)[],
  ): IJsonRpcResponse<any> {
    // send all errors messages as an response
    return this.jsonrpc.createError(request, {
      code: E_JSON_RPC_ERROR.INTERNAL_SERVER_ERROR,
      message: errors
        .map(e => {
          // errors with stack are uncaught errors
          // send the error's stack as a response
          return e instanceof Error ? `${e.message} ${e.stack.toString()}` : e;
        })
        .join(';'),
    });
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
        message: `resource not found: ${resourceId}`,
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
            this.jsonrpc.createEvent({ data, emitter: 'STREAM', resourceId: subscriptionId }),
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
        ...(!compactMode ? this.getResourceModel(helper) : {}),
      });
    } else if (responsePayload && responsePayload instanceof Service) {
      response = this.jsonrpc.createResponse(request, {
        _type: 'SERVICE',
        resourceId: responsePayload.serviceName,
        ...(!compactMode ? this.getResourceModel(responsePayload) : {}),
      });
    } else {
      // payload can contain helpers-objects
      // we have to wrap them in IpcProxy too
      traverse(responsePayload).forEach((item: any) => {
        if (item && item.isHelper === true) {
          const helper = this.getResource(item._resourceId);
          return {
            _type: 'HELPER',
            resourceId: helper._resourceId,
            ...(!compactMode ? this.getResourceModel(helper) : {}),
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
    return this.servicesManager.getResource(resourceId);
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

  private getResourceModel(helper: Object): Object {
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
