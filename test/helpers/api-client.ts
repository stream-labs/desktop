import { IJsonRpcRequest } from '../../app/services/jsonrpc';
import { Subject } from 'rxjs';
import { first } from 'rxjs/operators';

const net = require('net');
const { spawnSync } = require('child_process');
const snp = require('node-win32-np');

const PIPE_NAME = 'slobs';
const PIPE_PATH = `\\\\.\\pipe\\${PIPE_NAME}`;
const PROMISE_TIMEOUT = 20000;

let clientInstance: ApiClient = null;

export type TConnectionStatus = 'disconnected' | 'pending' | 'connected';

export class ApiClient {
  eventReceived = new Subject<any>();

  private nextRequestId = 1;
  private socket = new net.Socket();
  private resolveConnection: Function;
  private rejectConnection: Function;
  private requests = {};
  private subscriptions: Dictionary<Subject<any>> = {};
  private connectionStatus: TConnectionStatus = 'disconnected';

  /**
   * cached resourceSchemes
   */
  private resourceSchemes: Dictionary<Dictionary<string>> = {};

  /**
   * if result of calling a service method is promise -
   * we create a linked promise and keep it callbacks here until
   * the promise in the application will be resolved or rejected
   */
  private promises: Dictionary<Function[]> = {};

  // set to 'true' for debugging
  logsEnabled = false;

  constructor() {
    this.socket.on('connect', () => {
      this.log('connected');
      this.connectionStatus = 'connected';
      this.resolveConnection();
    });

    this.socket.on('error', (error: any) => {
      this.log('error', error);
      this.connectionStatus = 'disconnected';
      this.rejectConnection();
    });

    this.socket.on('data', (data: any) => {
      this.log(`Received: ${data}`);
      this.onMessageHandler(data);
    });

    this.socket.on('close', () => {
      this.connectionStatus = 'disconnected';
      this.log('Connection closed');
    });
  }

  connect() {
    this.log('connecting...');
    this.connectionStatus = 'pending';
    return new Promise((resolve, reject) => {
      this.resolveConnection = resolve;
      this.rejectConnection = reject;
      this.socket.connect(PIPE_PATH);
    });
  }

  disconnect() {
    this.socket.end();
    this.resolveConnection = null;
    this.rejectConnection = null;
  }

  getConnectionStatus(): TConnectionStatus {
    return this.connectionStatus;
  }

  log(...messages: string[]) {
    if (this.logsEnabled) console.log(...messages);
  }

  async request(resourceId: string, methodName: string, ...args: any[]) {
    if (this.connectionStatus === 'disconnected') {
      await this.connect();
    }

    const id = String(this.nextRequestId++);
    const requestBody: IJsonRpcRequest = {
      id,
      jsonrpc: '2.0',
      method: methodName,
      params: { args, resource: resourceId },
    };
    return this.sendMessage(requestBody);
  }

  requestSync(resourceId: string, methodName: string, ...args: string[]) {
    const id = String(this.nextRequestId++);
    const requestBody: IJsonRpcRequest = {
      id,
      jsonrpc: '2.0',
      method: methodName,
      params: { args, resource: resourceId },
    };

    const response = this.sendMessageSync(requestBody);
    const parsedResponse = JSON.parse(response.toString());

    if (parsedResponse.error) {
      throw parsedResponse.error;
    }

    return parsedResponse.result;
  }

  sendMessage(message: string | Object) {
    let requestBody: IJsonRpcRequest = message as IJsonRpcRequest;
    if (typeof message === 'string') {
      try {
        requestBody = JSON.parse(message);
      } catch (e) {
        throw 'Invalid JSON';
      }
    }

    if (!requestBody.id) throw 'id is required';

    return new Promise((resolve, reject) => {
      this.requests[requestBody.id] = {
        resolve,
        reject,
        body: requestBody,
        completed: false,
      };
      // tslint:disable-next-line:prefer-template TODO
      const rawMessage = JSON.stringify(requestBody) + '\n';
      this.log('Sent:', rawMessage);
      this.socket.write(rawMessage);
    });
  }

  sendMessageSync(message: string | Object) {
    let requestBody: IJsonRpcRequest = message as IJsonRpcRequest;
    if (typeof message === 'string') {
      try {
        requestBody = JSON.parse(message);
      } catch (e) {
        throw 'Invalid JSON';
      }
    }

    if (!requestBody.id) throw 'id is required';

    // tslint:disable-next-line:prefer-template TODO
    const rawMessage = JSON.stringify(requestBody) + '\n';
    this.log('Sent:', rawMessage);

    const client = new snp.Client(PIPE_PATH);
    client.write(Buffer.from(rawMessage));

    /* \x0a is being used as a message delimiter for
     * JSON-RPC messages. */
    const response = client.read_until('\x0a');
    client.close();

    return Buffer.concat(response);
  }

  onMessageHandler(data: ArrayBuffer) {
    data
      .toString()
      .split('\n')
      .forEach(rawMessage => {
        if (!rawMessage) return;
        const message = JSON.parse(rawMessage);
        const request = this.requests[message.id];

        if (request) {
          if (message.error) {
            request.reject(message.error);
          } else {
            request.resolve(message.result);
          }
          delete this.requests[message.id];
        }

        const result = message.result;
        if (!result) return;

        if (result._type === 'EVENT') {
          if (result.emitter === 'STREAM') {
            const eventSubject = this.subscriptions[message.result.resourceId];
            this.eventReceived.next(result.data);
            if (eventSubject) eventSubject.next(result.data);
          } else if (result.emitter === 'PROMISE') {
            // case when listenAllSubscriptions = true
            if (!this.promises[result.resourceId]) return;

            const [resolve, reject] = this.promises[result.resourceId];
            if (result.isRejected) {
              reject(result.data);
            } else {
              resolve(result.data);
            }
          }
        }
      });
  }

  unsubscribe(subscriptionId: string) {
    delete this.subscriptions[subscriptionId];
    return this.request(subscriptionId, 'unsubscribe');
  }

  unsubscribeAll() {
    return Promise.all(
      Object.keys(this.subscriptions).map(subscriptionId => this.unsubscribe(subscriptionId)),
    );
  }

  getResource<TResourceType>(resourceId: string, resourceModel = {}): TResourceType {
    const handleRequest = (resourceId: string, property: string, ...args: any[]): any => {
      const result = this.requestSync(resourceId, property as string, ...args);

      if (result && result._type === 'SUBSCRIPTION' && result.emitter === 'PROMISE') {
        return new Promise((resolve, reject) => {
          this.promises[result.resourceId] = [resolve, reject];
          setTimeout(
            () => reject(`promise timeout for ${resourceId}.${property}`),
            PROMISE_TIMEOUT,
          );
        });
        // tslint:disable-next-line:no-else-after-return
      } else if (result && result._type === 'SUBSCRIPTION' && result.emitter === 'STREAM') {
        let subject = this.subscriptions[result.resourceId];
        if (!subject) subject = this.subscriptions[result.resourceId] = new Subject();
        return subject;
      } else if (result && (result._type === 'HELPER' || result._type === 'SERVICE')) {
        return this.getResource(result.resourceId, result);
      } else {
        // result can contain helpers-objects

        if (Array.isArray(result)) {
          let i = result.length;
          while (i--) {
            const item = result[i];
            if (item._type !== 'HELPER') continue;
            result.splice(i, 1, this.getResource(item.resourceId, { ...item }));
          }
        }

        return result;
      }
    };

    return new Proxy(resourceModel, {
      get: (target, property: string, receiver) => {
        if (resourceModel[property] !== void 0) return resourceModel[property];

        const resourceScheme = this.getResourceScheme(resourceId);

        if (resourceScheme[property] !== 'function') {
          return handleRequest(resourceId, property as string);
        }

        return (...args: any[]) => {
          return handleRequest(resourceId, property as string, ...args);
        };
      },
    }) as TResourceType;
  }

  fetchNextEvent(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.eventReceived.pipe(first()).subscribe(event => resolve(event));
      setTimeout(() => reject('Promise timeout'), PROMISE_TIMEOUT);
    });
  }

  waitForEvent<TEvent extends Dictionary<any>>(
    constraint: (event: TEvent) => boolean,
  ): Promise<TEvent> {
    return new Promise((resolve, reject) => {
      const subscr = this.eventReceived.subscribe(event => {
        if (!constraint(event)) return;
        subscr.unsubscribe();
        resolve(event);
      });

      // stop waiting on timeout
      setTimeout(() => {
        subscr.unsubscribe();
        reject('Promise timeout');
      }, PROMISE_TIMEOUT);
    });
  }

  private getResourceTypeName(resourceId: string): string {
    return resourceId.split('[')[0];
  }

  private getResourceScheme(resourceId: string): Dictionary<string> {
    const resourceTypeName = this.getResourceTypeName(resourceId);

    if (!this.resourceSchemes[resourceTypeName]) {
      this.resourceSchemes[resourceTypeName] = this.requestSync(
        'ServicesManager',
        'getResourceScheme',
        resourceId,
      );
    }

    return this.resourceSchemes[resourceTypeName];
  }
}

export async function getClient() {
  if (!clientInstance) clientInstance = new ApiClient();

  if (clientInstance.getConnectionStatus() === 'disconnected') {
    await clientInstance.connect();
    await clientInstance.request('TcpServerService', 'listenAllSubscriptions');
  }

  return clientInstance;
}
