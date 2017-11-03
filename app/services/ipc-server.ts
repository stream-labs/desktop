import { Service } from './service';
import {
  IJsonRpcEvent, IJsonRpcRequest, IJsonRpcResponse,
  ServicesManager
} from '../services-manager';
import electron from 'electron';
const { ipcRenderer } = electron;

/**
 * sever for handling API requests from IPC
 * using by child window
 */
export class IpcServerService extends Service {

  servicesManager: ServicesManager = ServicesManager.instance;

  listen() {
    ipcRenderer.on('services-request', (event: Electron.Event, request: IJsonRpcRequest) => {
      const response: IJsonRpcResponse<any> = this.servicesManager.executeServiceRequest(request);
      ipcRenderer.send('services-response', response);
    });
    ipcRenderer.send('services-ready');

    this.servicesManager.serviceEvent.subscribe(event => this.sendEvent(event));
  }


  private sendEvent(event: IJsonRpcResponse<IJsonRpcEvent>) {
    ipcRenderer.send('services-message', event);
  }

}
