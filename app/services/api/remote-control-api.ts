import os from 'os';
import { authorizedHeaders, jfetch } from 'util/requests';
import { importSocketIOClient } from 'util/slow-imports';
import { ObjectSchema } from 'realm';
import { InitAfter, Inject, Service } from 'services/core';
import { RealmObject } from 'services/realm';
import { ExternalApiService, HostsService, UserService } from 'app-services';
import {
  JsonrpcService,
  E_JSON_RPC_ERROR,
  IJsonRpcRequest,
  IJsonRpcResponse,
} from 'services/api/jsonrpc/index';

export interface IConnectedDevice {
  socketId: string;
  deviceName: string;
  clientType: string;
}

interface ISLRemoteResponse {
  success: boolean;
  message: 'OK';
  data: {
    url: string;
    token: string;
  };
}

class ConnectedDevice extends RealmObject {
  socketId: string;
  deviceName: string;
  clientType: string;

  static schema: ObjectSchema = {
    name: 'ConnectedDevice',
    embedded: true,
    properties: {
      socketId: 'string',
      deviceName: 'string',
      clientType: 'string',
    },
  };
}

ConnectedDevice.register();

class RemoteControlEphemeralState extends RealmObject {
  devices: IConnectedDevice[];

  static schema: ObjectSchema = {
    name: 'RemoteControlEphemeralState',
    properties: {
      devices: {
        type: 'list',
        objectType: 'ConnectedDevice',
        default: [] as ConnectedDevice[],
      },
    },
  };
}

RemoteControlEphemeralState.register();

class RemoteControlPresistentState extends RealmObject {
  enabled: boolean;

  static schema: ObjectSchema = {
    name: 'RemoteControlPersistentState',
    properties: {
      enabled: { type: 'bool', default: false },
    },
  };
}

RemoteControlPresistentState.register({ persist: true });

@InitAfter('UserService')
export class RemoteControlService extends Service {
  @Inject() hostsService: HostsService;
  @Inject() userService: UserService;
  @Inject() externalApiService: ExternalApiService;
  @Inject() jsonRpcService: JsonrpcService;

  state = RemoteControlPresistentState.inject();
  connectedDevices = RemoteControlEphemeralState.inject();

  socket: SocketIOClient.Socket;

  init() {
    super.init();
    this.userService.userLogin.subscribe(() => {
      if (this.state.enabled) this.createStreamlabsRemoteConnection();
    });
  }

  disconnect() {
    this.setEnableRemoteConnection(false);
    this.socket.disconnect();
    this.socket = undefined;
    this.setConnectedDevices([]);
  }

  disconnectDevice(device: IConnectedDevice) {
    if (this.socket) {
      this.socket.emit('disconnectDevice', { socketId: device.socketId }, (response: any) => {
        if (!response.error) {
          this.removeConnectedDevice(device);
        }
      });
    }
  }

  async createStreamlabsRemoteConnection() {
    this.setEnableRemoteConnection(true);
    const io = await importSocketIOClient();
    const url = `https://${
      this.hostsService.streamlabs
    }/api/v5/slobs/modules/mobile-remote-io/config?device_name=${os.hostname()}`;
    console.log(os.hostname());
    const headers = authorizedHeaders(this.userService.apiToken);

    const resp: ISLRemoteResponse = await jfetch(new Request(url, { headers }));
    if (resp.success) {
      const socket = io.default(`${resp.data.url}?token=${resp.data.token}`, {
        transports: ['websocket'],
      });

      socket.emit('getDevices', {}, (devices: IConnectedDevice[]) => {
        this.setConnectedDevices(devices);
      });

      this.socket = socket;
      this.listen();
    }
  }

  listen() {
    if (this.socket) {
      this.socket.on('message', (data: Buffer) => {
        this.requestHandler(data.toString());
      });

      this.socket.on('deviceConnected', (device: IConnectedDevice) => {
        this.setConnectedDevices([...this.connectedDevices.devices, device]);
      });

      this.socket.on('deviceDisconnected', (device: IConnectedDevice) => {
        this.removeConnectedDevice(device);
      });

      this.socket.on('error', (e: unknown) => {
        throw e;
      });
    }
  }

  requestHandler(data: string) {
    const requests = data.split('\n');

    for (const requestString of requests) {
      if (!requestString) return;
      try {
        const request: IJsonRpcRequest = JSON.parse(requestString);

        const errorMessage = this.validateRequest(request);

        if (errorMessage) {
          const errorResponse = this.jsonRpcService.createError(request, {
            code: E_JSON_RPC_ERROR.INVALID_PARAMS,
            message: errorMessage,
          });
          this.sendResponse(errorResponse);
          return;
        }

        // Prevent access to certain particularly sensitive services
        const protectedResources = ['FileManagerService'];

        if (protectedResources.includes(request.params.resource)) {
          this.sendResponse(
            this.jsonRpcService.createError(request, {
              code: E_JSON_RPC_ERROR.INTERNAL_JSON_RPC_ERROR,
              message: 'The requested resource is not available.',
            }),
          );
          return;
        }

        const response = this.externalApiService.executeServiceRequest(request);

        this.sendResponse(response);
      } catch (e: unknown) {
        this.sendResponse(
          this.jsonRpcService.createError(null, {
            code: E_JSON_RPC_ERROR.INVALID_REQUEST,
            message:
              'Make sure that the request is valid json. ' +
              'If request string contains multiple requests, ensure requests are separated ' +
              'by a single newline character LF ( ASCII code 10)',
          }),
        );

        // Disconnect and stop processing requests
        // IMPORTANT: For security reasons it is important we immediately stop
        // processing requests that don't look will well formed JSON RPC calls.
        // Without this check, it is possible to send normal HTTP requests
        // from an unprivileged web page and make calls to this API.
        this.disconnect();
        return;
      }
    }
  }

  private validateRequest(request: IJsonRpcRequest): string {
    let message = '';
    if (!request.id) message += ' id is required;';
    if (!request.params) message += ' params is required;';
    if (request.params && !request.params.resource) message += ' resource is required;';
    return message;
  }

  private sendResponse(response: IJsonRpcResponse<any>) {
    if (this.socket) {
      try {
        this.socket.emit('message', `${JSON.stringify(response)}\n`, (response: any) => {
          if (response.error) {
            throw response.error;
          }
        });
      } catch (e: unknown) {
        // probably the client has been silently disconnected
        console.info('unable to send response', response, e);
      }
    }
    // unhandled exceptions completely destroy Rx.Observable subscription
  }

  setEnableRemoteConnection(val: boolean) {
    this.state.db.write(() => {
      this.state.enabled = val;
    });
  }

  setConnectedDevices(devices: IConnectedDevice[]) {
    this.connectedDevices.db.write(() => {
      this.connectedDevices.devices = devices;
    });
  }

  removeConnectedDevice(device: IConnectedDevice) {
    this.connectedDevices.db.write(() => {
      this.connectedDevices.devices = this.connectedDevices.devices.filter(
        d => d.socketId !== device.socketId,
      );
    });
  }
}
