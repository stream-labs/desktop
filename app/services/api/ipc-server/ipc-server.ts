import { Service } from 'services/service';
import electron from 'electron';
import { Subscription } from 'rxjs';
import { IJsonRpcRequest, IJsonRpcResponse, IJsonRpcEvent } from 'services/api/jsonrpc/index';
import { Inject } from 'util/injector';
import { InternalApiService } from 'services/api/internal-api';

const { ipcRenderer } = electron;

/**
 * sever for handling API requests from IPC
 * using by child window
 */
export class IpcServerService extends Service {
  servicesEventsSubscription: Subscription;
  requestHandler: Function;

  @Inject() private internalApiService: InternalApiService;

  listen() {
    this.requestHandler = (event: Electron.Event, request: IJsonRpcRequest) => {
      const response: IJsonRpcResponse<any> = this.exec(request);
      ipcRenderer.send('services-response', response);
    };
    ipcRenderer.on('services-request', this.requestHandler);
    ipcRenderer.send('services-ready');

    this.servicesEventsSubscription = this.internalApiService.serviceEvent.subscribe(event =>
      this.sendEvent(event),
    );
  }

  exec(request: IJsonRpcRequest) {
    return this.internalApiService.executeServiceRequest(request);
  }

  stopListening() {
    ipcRenderer.removeListener('services-request', this.requestHandler);
    this.servicesEventsSubscription.unsubscribe();
  }

  private sendEvent(event: IJsonRpcResponse<IJsonRpcEvent>) {
    ipcRenderer.send('services-message', event);
  }
}
