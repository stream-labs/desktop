import electron from 'electron';
import { Service } from '../service';
import { E_JSON_RPC_ERROR, IJsonRpcResponse, IJsonRpcRequest } from './jsonrpc-api';

const { ipcRenderer } = electron;

export class JsonrpcService extends Service {

  createError(
    options: { code: E_JSON_RPC_ERROR, id?: string|number, message?: string }
  ): IJsonRpcResponse<any> {
    return {
      jsonrpc: '2.0',
      id: options.id,
      error: {
        code: options.code,
        message: E_JSON_RPC_ERROR[options.code] + (options.message ? (' ' + options.message) : ''),
      }
    };
  }


  createRequest(resource: any, method: string, ...args: any[]): IJsonRpcRequest {
    const resourceId = resource.resourceId || resource.serviceName;
    if (!resourceId) throw 'invalid resource';

    return {
      jsonrpc: '2.0',
      id: ipcRenderer.sendSync('getUniqueId'),
      method,
      params: {
        resource: resourceId,
        args
      }
    };
  }
}