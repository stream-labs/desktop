import electron from 'electron';
import { Service } from '../service';
import {
  E_JSON_RPC_ERROR,
  IJsonRpcResponse,
  IJsonRpcRequest,
  IJsonRpcEvent,
  IJsonrpcServiceApi
} from './jsonrpc-api';

const { ipcRenderer } = electron;

export class JsonrpcService extends Service implements IJsonrpcServiceApi {
  createError(
    requestOrRequestId: string | IJsonRpcRequest,
    options: { code: E_JSON_RPC_ERROR; message?: string }
  ): IJsonRpcResponse<any> {
    const id =
      (arguments[0] && typeof arguments[0] === 'object')
        ? (arguments[0] as IJsonRpcRequest).id
        : arguments[0];
    return {
      jsonrpc: '2.0',
      id,
      error: {
        code: options.code,
        message:
          E_JSON_RPC_ERROR[options.code] +
          (options.message ? ' ' + options.message : '')
      }
    };
  }

  createRequest(
    resourceId: string,
    method: string,
    ...args: any[]
  ): IJsonRpcRequest {
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

  createRequestWithOptions(
    resourceId: string,
    method: string,
    options: { compactMode: boolean, fetchMutations: boolean },
    ...args: any[]
  ): IJsonRpcRequest {
    const request = this.createRequest(resourceId, method, ...args);
    request.params = { ...request.params, ...options };
    return request;
  }

  createResponse<TResult>(
    requestOrRequestId: string | IJsonRpcRequest,
    result: TResult
  ): IJsonRpcResponse<TResult> {
    const id =
      (arguments[0] && typeof arguments[0] === 'object')
        ? (arguments[0] as IJsonRpcRequest).id
        : arguments[0];
    return { jsonrpc: '2.0', id, result } as IJsonRpcResponse<TResult>;
  }

  createEvent(options: {
    emitter: 'PROMISE' | 'STREAM';
    resourceId: string;
    data: any;
    isRejected?: boolean
  }): IJsonRpcResponse<IJsonRpcEvent> {
    return this.createResponse<IJsonRpcEvent>(null, {
      _type: 'EVENT',
      ...options
    });
  }
}
